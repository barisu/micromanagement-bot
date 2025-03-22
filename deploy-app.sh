#!/bin/bash
set -e

# 環境変数ファイルを読み込む
source .env

# AWS リージョンとスタック名を設定
AWS_REGION="ap-northeast-1"
INFRA_STACK_NAME="micromanagement-bot-dev"
APP_STACK_NAME="micromanagement-bot-app-dev"
ECR_REPOSITORY="micromanagement-bot-dev"
IMAGE_TAG=$(git rev-parse --short HEAD)

echo "=== アプリケーション更新開始 ==="
echo "アプリケーションスタック名: ${APP_STACK_NAME}"
echo "ECRリポジトリ名: ${ECR_REPOSITORY}"
echo "イメージタグ: ${IMAGE_TAG}"

# ECRにログイン
echo "ECRにログイン..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com

# Dockerイメージをビルドしてプッシュ
echo "Dockerイメージのビルドとプッシュ..."
ECR_REGISTRY=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com

docker build -t ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG} -t ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest .
docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

# アプリケーションスタックをデプロイ
echo "アプリケーションスタックのデプロイ..."
aws cloudformation deploy \
  --template-file infra/application.yml \
  --stack-name ${APP_STACK_NAME} \
  --parameter-overrides \
    Stage=dev \
    InfraStackName=${INFRA_STACK_NAME} \
    ImageTag=${IMAGE_TAG} \
    SlackSigningSecret=${SLACK_SIGNING_SECRET} \
    SlackBotToken=${SLACK_BOT_TOKEN} \
    SlackChannel=${SLACK_CHANNEL} \
    TaskListId=${TASK_LIST_ID} \
    ClientId=${CLIENT_ID} \
    ClientSecret=${CLIENT_SECRET} \
    RedirectUri=${REDIRECT_URI} \
    RefreshToken=${REFRESH_TOKEN} \
    OpenAIApiKey=${OPENAI_API_KEY} \
    SlackUserId=${SLACK_USER_ID} \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset

echo "=== アプリケーション更新完了 ==="
echo "アプリケーションスタック名: ${APP_STACK_NAME}"
echo "イメージタグ: ${IMAGE_TAG}"

# スタック情報を表示
echo "アプリケーションスタック情報:"
aws cloudformation describe-stacks --stack-name ${APP_STACK_NAME} --query "Stacks[0].Outputs" --output table
