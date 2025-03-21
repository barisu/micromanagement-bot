# Serverless FrameworkからCloudFormationへの移行

このドキュメントでは、Serverless FrameworkからAWS CloudFormationへの移行手順について説明します。

## 移行の背景

Serverless Frameworkは便利なツールですが、AWSリソースの管理においてより直接的な制御が必要な場合や、特定の権限の問題が発生した場合には、CloudFormationを直接使用することでより柔軟な対応が可能になります。

## 移行内容

以下のリソースをServerless FrameworkからCloudFormationに移行しました：

1. ECRリポジトリ
2. Lambda関数（slack, dailyReport）
3. API Gateway
4. EventBridge（スケジュールイベント）
5. S3バケット（デプロイメントバケット）
6. 必要なIAMロール

## ファイル構成

- `infra/template.yml` - CloudFormationテンプレート
- `.github/workflows/deploy.yml` - GitHub Actionsワークフロー

## デプロイ方法

### 手動デプロイ

AWS CLIを使用して手動でデプロイする場合は、以下のコマンドを実行します：

```bash
# 環境変数をエクスポート
export SLACK_SIGNING_SECRET=your-secret
export SLACK_BOT_TOKEN=your-token
# ... 他の環境変数も同様に設定

# CloudFormationスタックをデプロイ
aws cloudformation deploy \
  --template-file infra/template.yml \
  --stack-name micromanagement-bot-dev \
  --parameter-overrides \
    Stage=dev \
    SlackSigningSecret=$SLACK_SIGNING_SECRET \
    SlackBotToken=$SLACK_BOT_TOKEN \
    SlackChannel=$SLACK_CHANNEL \
    TaskListId=$TASK_LIST_ID \
    ClientId=$CLIENT_ID \
    ClientSecret=$CLIENT_SECRET \
    RedirectUri=$REDIRECT_URI \
    RefreshToken=$REFRESH_TOKEN \
    OpenAIApiKey=$OPENAI_API_KEY \
    SlackUserId=$SLACK_USER_ID \
  --capabilities CAPABILITY_NAMED_IAM
```

### GitHub Actionsによる自動デプロイ

GitHub Actionsを使用して自動デプロイする場合は、以下の手順を実行します：

1. GitHubリポジトリのSecretsに必要な環境変数を設定します：
   - `AWS_ACCOUNT_ID`
   - `SLACK_SIGNING_SECRET`
   - `SLACK_BOT_TOKEN`
   - `SLACK_CHANNEL`
   - `TASK_LIST_ID`
   - `CLIENT_ID`
   - `CLIENT_SECRET`
   - `REDIRECT_URI`
   - `REFRESH_TOKEN`
   - `OPENAI_API_KEY`
   - `SLACK_USER_ID`

2. コードをmainブランチにプッシュするか、GitHub Actionsのワークフローを手動で実行します。

## 注意事項

### Dockerイメージのビルドとプッシュ

CloudFormationはDockerイメージのビルドとプッシュを自動化しないため、GitHub Actionsワークフローでこの処理を行っています。

### IAMロールの権限

CloudFormationテンプレートをデプロイするには、適切なIAM権限が必要です。`infra/github-actions-role.yml`で定義されているIAMロールを使用しています。

### 環境変数の管理

環境変数はCloudFormationパラメータとして渡されます。本番環境では、AWS Systems Manager Parameter StoreやSecrets Managerを使用して機密情報を管理することを検討してください。

## トラブルシューティング

### デプロイエラー

デプロイ中にエラーが発生した場合は、CloudFormationコンソールでスタックのイベントを確認してください。一般的なエラーとしては、IAM権限の不足や、リソース名の重複などがあります。

### リソースの削除

CloudFormationスタックを削除すると、スタック内のすべてのリソースが削除されます。ただし、S3バケットなど一部のリソースは、中身が空でない場合は削除されないことがあります。その場合は、手動でリソースをクリーンアップしてから、スタックを削除してください。
