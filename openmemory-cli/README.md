# OpenMemory CLI

OpenMemory CLIは、Internet Computer上のOpenMemoryキャニスターと対話するためのコマンドラインツールです。LocalIdentity認証（dfx identityと同じ）を使用してセキュアにメモリの管理ができます。

## インストール

```bash
cd openmemory-cli
cargo build --release
cargo install --path .
```

## 初期設定

初回実行時にCLI設定を行います：

```bash
openmemory init
```

以下の設定を行います：
- **認証方法**: LocalIdentity（推奨）またはAPIキー
- **ネットワーク**: IC（メインネット）またはローカル開発環境
- **キャニスターID**: OpenMemoryキャニスターのID

## 使用方法

### メモリの追加

```bash
# 基本的な使用方法
openmemory add "今日学んだRustのthread_localパターンについて"

# タグとメタデータ付き
openmemory add "ICPのセキュリティベストプラクティス" --tags "icp,security,blockchain" --metadata '{"category":"tech","priority":"high"}'
```

### メモリの検索

```bash
# セマンティック検索
openmemory search "Rustの並行処理"

# 結果数を指定
openmemory search "blockchain security" --limit 20
```

### メモリの一覧表示

```bash
# 最新10件のメモリを表示
openmemory list

# 件数を指定
openmemory list --count 20
```

### メモリの削除

```bash
openmemory delete <memory-id>
```

### 設定管理

```bash
# OpenAI APIキーの設定（埋め込みベクトル生成用）
openmemory config set-openai-key

# キャニスターIDの変更
openmemory config set-canister <canister-id>

# 現在の設定を表示
openmemory config show
```

### 認証管理

```bash
# 現在のPrincipal IDを表示
openmemory auth principal

# 認証方法の切り替え
openmemory auth switch

# LocalIdentityのリセット（新しいIDを生成）
openmemory auth reset
```

### トークン管理（ハイブリッド認証）

フロントエンドでII認証 → CLIでトークン使用の流れ：

```bash
# 1. ブラウザでII認証してトークンを作成（LocalIdentity認証必要）
openmemory token create --description "MacBook CLI" --expires-in-days 30

# 2. 生成されたトークンを使用
openmemory token use <access-token>

# 3. トークン一覧を確認
openmemory token list

# 4. トークンを無効化
openmemory token revoke <access-token>
```

**メリット**：
- フロントエンドとCLIで同じユーザーデータを共有
- トークンごとに権限設定可能
- セキュアな認証（有効期限、無効化機能）

### 現在の設定確認

```bash
openmemory whoami
```

## LocalIdentityについて

LocalIdentityは、IC-Agentが提供する標準的な認証方式で、以下の特徴があります：

- **秘密鍵の自動生成**: `~/.config/openmemory/identity.pem`に保存
- **セキュア**: ファイル権限600で保護
- **互換性**: dfx identityと同じ仕組み
- **永続性**: 一度生成したIDは再利用可能

## 設定ファイル

設定は以下の場所に保存されます：
- macOS/Linux: `~/.config/openmemory/config.json`
- Windows: `%APPDATA%\openmemory\config.json`

設定ファイルの例：
```json
{
  "type": "LocalIdentity",
  "network": "ic",
  "canister_id": "77fv5-oiaaa-aaaal-qsoea-cai",
  "openai_api_key": "sk-..."
}
```

## トラブルシューティング

### 「User ID required for search」エラー
LocalIdentity認証を使用していることを確認してください：
```bash
openmemory auth switch
```

### 「No API configuration found」エラー
OpenAI APIキーを設定してください：
```bash
openmemory config set-openai-key
```

### ローカル開発環境での使用
```bash
# ローカルネットワークを指定
openmemory --network local add "test memory"

# または初期設定でlocalを選択
openmemory init
```

## セキュリティ

- LocalIdentityの秘密鍵は安全に保管してください
- APIキーは暗号化されてローカルに保存されます
- キャニスター側でもユーザーごとにデータが分離されています