<p align="center">
  <img src="assets/snapterra_logo.png" alt="SnapTerra Logo" width="120" />
</p>

<h1 align="center">SnapTerra</h1>

<p align="center">
  <strong>Auto-Generated Infrastructure & CI/CD Boilerplates</strong><br />
  Terraform + CI/CD パイプラインのボイラープレートファイルをブラウザ上で自動生成
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Terraform-v1.5%2B-7B42BC?logo=terraform&logoColor=white" alt="Terraform" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  <img src="https://img.shields.io/badge/Hosting-GitHub%20Pages-222?logo=github&logoColor=white" alt="GitHub Pages" />
</p>

---

## 概要

**SnapTerra** は、Terraform によるインフラ構築と CI/CD パイプライン構築に必要なボイラープレートファイル群をブラウザ上でワンクリック生成する静的 Web アプリケーションです。

プラットフォームとプロバイダーを選択するだけで、すぐにデプロイ可能な設定ファイルがリアルタイムに生成されます。

## 主な機能

### CI/CD パイプライン対応

| プラットフォーム | 生成ファイル |
|---|---|
| GitHub Actions | `.github/workflows/terraform.yml` |
| GitLab CI | `.gitlab-ci.yml` |
| Bitbucket Pipelines | `bitbucket-pipelines.yml` |
| CircleCI | `.circleci/config.yml` |

### プリセット対応プロバイダー

#### クラウド

| プロバイダー | Terraform Source |
|---|---|
| Amazon Web Services | `hashicorp/aws` |
| Google Cloud | `hashicorp/google` |
| Microsoft Azure | `hashicorp/azurerm` |
| Oracle Cloud (OCI) | `oracle/oci` |
| DigitalOcean | `digitalocean/digitalocean` |
| Alibaba Cloud | `aliyun/alicloud` |

#### ネットワーク

| プロバイダー | Terraform Source |
|---|---|
| Palo Alto Networks (PAN-OS) | `PaloAltoNetworks/panos` |
| Fortinet (FortiOS) | `fortinetdev/fortios` |
| Cisco Meraki | `CiscoDevNet/meraki` |
| Cisco IOS-XE | `CiscoDevNet/iosxe` |

> カスタムプロバイダーも Terraform Registry から任意に追加できます。

### 生成ファイル一覧

| ファイル | 内容 |
|---|---|
| `.gitignore` | Terraform 用の除外設定 |
| `providers.tf` | プロバイダー設定・バックエンド構成 |
| `variables.tf` | 必須変数定義（認証情報等） |
| `main.tf` | サンプルリソース定義 |
| CI/CD 設定ファイル | パイプライン定義（format → validate → plan → apply） |

### その他の機能

- **パイプラインステップのカスタマイズ** — fmt / validate / plan / apply / destroy を個別に ON/OFF
- **コードコピー** — ボタン一つでクリップボードにコピー
- **ZIP ダウンロード** — 全ファイルを一括ダウンロード
- **Terraform Registry 連携** — カスタムプロバイダー追加時に Registry API から最新バージョンと設定を自動取得
- **CI/CD 環境変数ヒント** — GitHub Secrets / GitLab CI Variables 等の設定例を自動表示

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | HTML5 / CSS3 / Vanilla JavaScript |
| フォント | [Inter](https://fonts.google.com/specimen/Inter) / [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) |
| アイコン | [Lucide Icons](https://lucide.dev/) (インライン SVG) |
| ホスティング | GitHub Pages |
| CI/CD | GitHub Actions (自動デプロイ) |

## プロジェクト構成

```
snapterra/
├── index.html          # エントリーポイント
├── app.js              # アプリケーションロジック
├── styles.css          # スタイルシート
├── assets/             # 画像ファイル
│   ├── snapterra_logo.png
│   ├── snapterra_title.png
│   └── registry-guide.png
├── docs/               # ドキュメント
│   └── 要件定義表.md
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages デプロイ
├── .gitignore
└── README.md
```

## ローカルでの実行

サーバーサイドの処理は不要です。任意の HTTP サーバーで `index.html` を配信するだけで動作します。

```bash
# 例: Python の簡易サーバー
python -m http.server 8080

# 例: Node.js の npx
npx serve .
```

ブラウザで `http://localhost:8080` にアクセスしてください。

## デプロイ

`main` ブランチへの Push をトリガーに、GitHub Actions が自動で GitHub Pages へデプロイします。

## ライセンス

MIT License
