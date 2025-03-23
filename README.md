# マネジメントボット

Todo管理とSlack通知を行うサービスです。AWS Lambdaで動作します。

## 概要

このサービスは以下の機能を提供します:

- Google Tasksとの連携によるToDo管理
- Slackへの通知
- 定期的なタスクレポート生成
- OpenAIを活用したタスク分析

## デプロイ方法

### 前提条件

- AWSアカウント
- GitHubリポジトリへのアクセス権限
- Node.js環境

### AWS環境のセットアップ

1. **GitHub OIDC IDプロバイダの設定**

   AWSコンソールでIAM > IDプロバイダー > プロバイダーの作成から以下を設定:
   - プロバイダータイプ: OpenID Connect
   - プロバイダーURL: `https://token.actions.githubusercontent.com`
   - 対象者: `sts.amazonaws.com`

2. **CloudFormationを使用したIAMロールの作成**

   `infra/github-actions-role.yml`を使用して、GitHub ActionsがAWSリソースにアクセスするためのロールを作成します。このロールには、Serverlessフレームワークを使ったデプロイに必要な最小限の権限が設定されています:

   ```bash
   aws cloudformation create-stack \
     --stack-name github-actions-role \
     --template-body file://infra/github-actions-role.yml \
     --parameters \
       ParameterKey=GitHubOrg,ParameterValue=あなたのGitHub組織名 \
       ParameterKey=RepositoryName,ParameterValue=management-bot \
       ParameterKey=OIDCProviderArn,ParameterValue=arn:aws:iam::あなたのAWSアカウントID:oidc-provider/token.actions.githubusercontent.com \
     --capabilities CAPABILITY_NAMED_IAM
   ```

   このテンプレートで設定される主な権限は以下の通りです:
   - ECRリポジトリ操作（作成、更新、イメージのプッシュなど）
   - CloudFormationスタックの管理
   - Lambdaの操作
   - API Gatewayの設定
   - S3バケットの操作
   - IAMロールの操作（LambdaのExecutionRoleなど）

3. **作成されたロールARNの確認**

   ```bash
   aws cloudformation describe-stacks \
     --stack-name github-actions-role \
     --query "Stacks[0].Outputs[?OutputKey=='RoleARN'].OutputValue" \
     --output text
   ```

### GitHub Secretsの設定

GitHub リポジトリのSettings > Secrets and variables > Actionsで以下のシークレットを設定:

- `AWS_ACCOUNT_ID`: AWSアカウントID
- `SLACK_SIGNING_SECRET`: SlackアプリのSigning Secret
- `SLACK_BOT_TOKEN`: SlackボットのOAuthトークン
- `SLACK_CHANNEL`: 通知を送信するSlackチャンネルID
- `TASK_LIST_ID`: Google TasksのタスクリストID
- `CLIENT_ID`: Google OAuth クライアントID
- `CLIENT_SECRET`: Google OAuth クライアントシークレット
- `REDIRECT_URI`: OAuth リダイレクトURI
- `REFRESH_TOKEN`: Google OAuth リフレッシュトークン
- `OPENAI_API_KEY`: OpenAI API キー
- `SLACK_USER_ID`: メンションを監視するSlackユーザーID

### 自動デプロイ

mainブランチにプッシュすると、GitHub Actionsワークフロー（`.github/workflows/deploy.yml`）が自動的に実行され、AWS Lambdaにデプロイされます。

## ローカル開発

### 依存関係のインストール

```bash
pnpm install
```

### ローカル実行

```bash
pnpm run build
pnpm start
```

## 定期実行

毎日日本時間20:00（UTC 11:00）に自動的にタスクレポートが生成され、設定されたSlackチャンネルに送信されます。この設定は`infrastructure.yml`の`functions.dailyReport.events`セクションで変更できます。
