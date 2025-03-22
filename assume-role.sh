#!/bin/bash
set -e

# アカウントIDを取得
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="ap-northeast-1"

echo "AWS アカウントID: ${ACCOUNT_ID}"
echo "リージョン: ${REGION}"

# ロールを引き受ける
echo "GitHubActionsServerlessDeployRoleロールを引き受けています..."
CREDENTIALS=$(aws sts assume-role \
  --role-arn arn:aws:iam::${ACCOUNT_ID}:role/GitHubActionsServerlessDeployRole \
  --role-session-name CLI-Session)

# 認証情報を環境変数として設定
export AWS_ACCESS_KEY_ID=$(echo $CREDENTIALS | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $CREDENTIALS | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $CREDENTIALS | jq -r '.Credentials.SessionToken')

echo "一時認証情報を設定しました。この認証情報は$(echo $CREDENTIALS | jq -r '.Credentials.Expiration')まで有効です。"
echo "これでGitHubActionsServerlessDeployRoleロールとしてAWS CLIコマンドを実行できます。"
echo ""
echo "例："
echo "aws cloudformation deploy --template-file infra/template.yml --stack-name micromanagement-bot-test ..."
echo "aws ecr describe-repositories --repository-names micromanagement-bot-dev"
echo ""
echo "現在のIAM認証情報："
aws sts get-caller-identity
