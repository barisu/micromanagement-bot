#!/bin/bash
set -e

# 環境変数ファイルを読み込む
source .env

# AWS リージョンとスタック名を設定
AWS_REGION="ap-northeast-1"
INFRA_STACK_NAME="micromanagement-bot-infra-dev"
APP_STACK_NAME="micromanagement-bot-app-dev"
ECR_REPOSITORY="micromanagement-bot-dev"
IMAGE_TAG=$(git rev-parse --short HEAD)

echo "=== 初回デプロイ開始 ==="
echo "インフラスタック名: ${INFRA_STACK_NAME}"
echo "アプリケーションスタック名: ${APP_STACK_NAME}"
echo "ECRリポジトリ名: ${ECR_REPOSITORY}"
echo "イメージタグ: ${IMAGE_TAG}"

# インフラスタックをデプロイ
echo "インフラスタックのデプロイ..."
aws cloudformation deploy \
  --template-file infra/infrastructure.yml \
  --stack-name ${INFRA_STACK_NAME} \
  --parameter-overrides \
    Stage=dev \
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
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset

echo "=== 初回デプロイ完了 ==="
echo "インフラスタック名: ${INFRA_STACK_NAME}"
echo "アプリケーションスタック名: ${APP_STACK_NAME}"
echo "ECRリポジトリ名: ${ECR_REPOSITORY}"
echo "イメージタグ: ${IMAGE_TAG}"

# スタック情報を表示
echo "インフラスタック情報:"
aws cloudformation describe-stacks --stack-name ${INFRA_STACK_NAME} --query "Stacks[0].Outputs" --output table
