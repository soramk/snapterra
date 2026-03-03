/* ==========================================================================
   Terraform Boilerplate Generator — File Generation Logic
   ========================================================================== */

function generateFiles(platform, provider) {
  const files = [];
  const cfg = getProviderConfig(provider);
  const provKey = getProviderKey(provider);

  // 1. .gitignore (common)
  files.push({
    name: '.gitignore',
    language: 'plaintext',
    content: `# Local .terraform directories
**/.terraform/*

# .tfstate files
*.tfstate
*.tfstate.*

# Crash log files
crash.log
crash.*.log

# Environment variables
.env
.env.*

*.tfvars
*.tfvars.json
override.tf
override.tf.json
*_override.tf
*_override.tf.json
*.tfplan
.terraformrc
terraform.rc
`,
  });

  // 2. providers.tf — uses provider-specific templates for presets, generic for custom
  const providersTfContent = generateProvidersTf(provider, cfg, provKey);
  files.push({ name: 'providers.tf', language: 'hcl', content: providersTfContent });

  // 3. variables.tf
  const variablesTfContent = generateVariablesTf(provider, cfg, provKey);
  files.push({ name: 'variables.tf', language: 'hcl', content: variablesTfContent });

  // 4. main.tf
  const mainTfContent = generateMainTf(provider, cfg, provKey);
  files.push({ name: 'main.tf', language: 'hcl', content: mainTfContent });

  // 5. CI/CD Pipeline
  const cicdFile = generateCicdFile(platform, provider);
  if (cicdFile) files.push(cicdFile);

  return files;
}

function generateProvidersTf(provider, cfg, provKey) {
  // Preset provider-specific templates
  const presetTemplates = {
    aws: (c) => `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "${c.source}"
      version = "${c.version}"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
`,
    gcp: (c) => `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "${c.source}"
      version = "${c.version}"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}
`,
    azure: (c) => `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "${c.source}"
      version = "${c.version}"
    }
  }
}

provider "azurerm" {
  features {}
}
`,
    oci: (c) => `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    oci = {
      source  = "${c.source}"
      version = "${c.version}"
    }
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}
`,
    digitalocean: (c) => `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    digitalocean = {
      source  = "${c.source}"
      version = "${c.version}"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}
`,
    alibaba: (c) => `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    alicloud = {
      source  = "${c.source}"
      version = "${c.version}"
    }
  }
}

provider "alicloud" {
  access_key = var.alicloud_access_key
  secret_key = var.alicloud_secret_key
  region     = var.alicloud_region
}
`,
    panos: (c) => `terraform {
  required_version = ">= 1.8.0"
  required_providers {
    panos = {
      source  = "${c.source}"
      version = "${c.version}"
    }
  }
}

# API key based authentication
provider "panos" {
  hostname = var.panos_hostname
  api_key  = var.panos_api_key
}

# Username/password authentication (alternative)
# provider "panos" {
#   hostname = var.panos_hostname
#   username = var.panos_username
#   password = var.panos_password
# }
`,
    fortios: (c) => `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    fortios = {
      source  = "${c.source}"
      version = "${c.version}"
    }
  }
}

# Token based authentication (Recommended)
provider "fortios" {
  hostname     = var.fortios_hostname
  token        = var.fortios_token
  insecure     = var.fortios_insecure
  # cabundlefile = "/path/yourCA.crt"
  # vdom         = "root"
}

# Username/password authentication (alternative)
# provider "fortios" {
#   hostname = var.fortios_hostname
#   username = var.fortios_username
#   password = var.fortios_password
#   insecure = var.fortios_insecure
# }
`,
    meraki: (c) => `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    meraki = {
      source  = "${c.source}"
      version = "${c.version}"
    }
  }
}

provider "meraki" {
  api_key = var.meraki_api_key
  # base_url = "https://api.meraki.com/api/v1"  # Default
}
`,
    iosxe: (c) => `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    iosxe = {
      source  = "${c.source}"
      version = "${c.version}"
    }
  }
}

provider "iosxe" {
  username = var.iosxe_username
  password = var.iosxe_password
  host     = var.iosxe_host
  insecure = true
  # protocol = "netconf"  # Default: netconf, alternative: restconf
}
`,
  };

  if (presetTemplates[provider]) {
    return presetTemplates[provider](cfg);
  }

  // Generic template for custom providers
  const prov = state.providers.find(p => p.id === provider);
  const meta = prov?.registryMeta;

  let providerBlockStr;
  if (meta?.providerBlock) {
    providerBlockStr = `\n${meta.providerBlock}\n`;
  } else {
    providerBlockStr = `\nprovider "${provKey}" {\n  # TODO: Configure provider settings\n  # APIキーなどは variables.tf 経由で設定することを推奨します\n}\n`;
  }

  return `terraform {
  required_version = ">= 1.5.0"

  required_providers {
    ${provKey} = {
      source  = "${cfg.source}"
      version = "${cfg.version}"
    }
  }
}
${providerBlockStr}`;
}

function generateBackendTf(provKey) {
  const b = state.backend;
  if (!b || b.type === 'local') return '# backend "local" { } # Default';

  if (b.type === 's3') {
    return `backend "s3" {
    bucket         = "${b.bucket || 'my-tfstate-bucket'}"
    key            = "terraform/${provKey}/terraform.tfstate"
    region         = "${b.region || 'ap-northeast-1'}"
    encrypt        = true
    # dynamodb_table = "terraform-lock"
  }`;
  }

  if (b.type === 'gcs') {
    return `backend "gcs" {
    bucket = "${b.bucket || 'my-tfstate-bucket'}"
    prefix = "terraform/${provKey}"
  }`;
  }

  if (b.type === 'azurerm') {
    return `backend "azurerm" {
    resource_group_name  = "${b.resourceGroup || 'rg-terraform'}"
    storage_account_name = "${b.storageAccount || 'stterraformstate'}"
    container_name       = "tfstate"
    key                  = "${provKey}.terraform.tfstate"
  }`;
  }

  if (b.type === 'cloud') {
    return `cloud {
    organization = "${b.organization || 'my-org'}"
    workspaces {
      name = "${b.workspace || 'my-app-prod'}"
    }
  }`;
  }

  return '# backend configuration';
}

// ------------------------------------------------------------
// Generate backend block for main.tf with CI/CD-specific local
// partial configuration hints
// ------------------------------------------------------------
function generateBackendBlock(provKey) {
  const b = state.backend;
  const platform = state.platform;

  // --- Full remote backend (user specified remote settings) ---
  if (b && b.type !== 'local') {
    const backendContent = generateBackendTf(provKey);
    const localHints = generateLocalBackendHints(b.type, provKey, platform);
    return `terraform {
  ${backendContent}
}
${localHints}`;
  }

  // --- Local backend (no remote) — generate platform-aware partial config hints ---
  return generatePartialBackendBlock(provKey, platform);
}

// Generate a partial (empty) backend block with terraform init hints per CI/CD
function generatePartialBackendBlock(provKey, platform) {
  if (platform === 'github') {
    return `# ==============================================================================
# Remote Backend Configuration (Partial — GitHub Actions)
# ==============================================================================
# GitHub Actions ではリポジトリの Secrets/Variables や環境変数から
# terraform init -backend-config で値を注入します。
#
# ローカルに保持するのは空の backend ブロックのみ:
terraform {
  backend "http" {
  }
}
# terraform init 実行例 (ローカル):
#   terraform init \\
#     -backend-config="address=https://example.com/api/v4/projects/<ID>/terraform/state/<NAME>" \\
#     -backend-config="lock_address=https://example.com/api/v4/projects/<ID>/terraform/state/<NAME>/lock" \\
#     -backend-config="unlock_address=https://example.com/api/v4/projects/<ID>/terraform/state/<NAME>/lock" \\
#     -backend-config="username=<USERNAME>" \\
#     -backend-config="password=<TOKEN>"
#
# GitHub Actions (CI/CD) での設定:
#   env:
#     TF_BACKEND_CONFIG: |
#       address=https://...
#       lock_address=https://...
#       unlock_address=https://...
#   steps:
#     - run: terraform init -backend-config="$TF_BACKEND_CONFIG"
`;
  }

  if (platform === 'gitlab') {
    return `# ==============================================================================
# Remote Backend Configuration (Partial — GitLab CI)
# ==============================================================================
# GitLab CI/CD では GitLab マネージド Terraform State を使用できます。
# GitLab が自動で TF_HTTP_* 環境変数を設定するため、
# ローカルに保持するのは空の backend ブロックのみで動作します。
#
# ローカルに保持するのは空の backend ブロックのみ:
terraform {
  backend "http" {
  }
}
# terraform init 実行例 (ローカル):
#   export TF_HTTP_ADDRESS="https://gitlab.example.com/api/v4/projects/<PROJECT_ID>/terraform/state/${provKey}"
#   export TF_HTTP_LOCK_ADDRESS="$TF_HTTP_ADDRESS/lock"
#   export TF_HTTP_UNLOCK_ADDRESS="$TF_HTTP_ADDRESS/lock"
#   export TF_HTTP_USERNAME="<USERNAME>"
#   export TF_HTTP_PASSWORD="<PERSONAL_ACCESS_TOKEN>"
#   export TF_HTTP_LOCK_METHOD="POST"
#   export TF_HTTP_UNLOCK_METHOD="DELETE"
#   terraform init
#
# GitLab CI/CD では .gitlab-ci.yml で以下を追加するだけで自動設定されます:
#   include:
#     - template: Terraform.latest.gitlab-ci.yml
`;
  }

  if (platform === 'bitbucket') {
    return `# ==============================================================================
# Remote Backend Configuration (Partial — Bitbucket Pipelines)
# ==============================================================================
# Bitbucket Pipelines では S3 互換のバックエンドや HTTP バックエンドを利用します。
# ローカルに保持するのは空の backend ブロックのみ:
terraform {
  backend "s3" {
  }
}
# terraform init 実行例 (ローカル):
#   terraform init \\
#     -backend-config="bucket=my-tfstate-bucket" \\
#     -backend-config="key=terraform/${provKey}/terraform.tfstate" \\
#     -backend-config="region=ap-northeast-1" \\
#     -backend-config="encrypt=true"
#
# Bitbucket Pipelines (CI/CD) では Repository Variables に設定:
#   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
#   BITBUCKET_PIPE_BACKEND_CONFIG (下記例):
#   steps:
#     - script:
#         - terraform init
#           -backend-config="bucket=$TF_STATE_BUCKET"
#           -backend-config="key=$BITBUCKET_REPO_SLUG/terraform.tfstate"
#           -backend-config="region=$AWS_DEFAULT_REGION"
`;
  }

  if (platform === 'circleci') {
    return `# ==============================================================================
# Remote Backend Configuration (Partial — CircleCI)
# ==============================================================================
# CircleCI では backend 設定ファイル (.hcl) または
# terraform init -backend-config で値を注入します。
# ローカルに保持するのは空の backend ブロックのみ:
terraform {
  backend "s3" {
  }
}
# terraform init 実行例 (ローカル):
#   terraform init \\
#     -backend-config="bucket=my-tfstate-bucket" \\
#     -backend-config="key=terraform/${provKey}/terraform.tfstate" \\
#     -backend-config="region=ap-northeast-1" \\
#     -backend-config="encrypt=true"
#
# または backend.hcl ファイルを使用:
#   terraform init -backend-config=backend.hcl
#
# backend.hcl の例:
#   bucket         = "my-tfstate-bucket"
#   key            = "terraform/${provKey}/terraform.tfstate"
#   region         = "ap-northeast-1"
#   encrypt        = true
#   dynamodb_table = "terraform-lock"
#
# CircleCI Project Settings → Environment Variables に設定:
#   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
`;
  }

  // Fallback
  return `# ==============================================================================
# Remote Backend Configuration
# ==============================================================================
# バックエンドタイプを選択し、terraform init -backend-config で値を注入してください。
terraform {
  backend "http" {
  }
}
# terraform init \\
#   -backend-config="address=https://example.com/state" \\
#   -backend-config="lock_address=https://example.com/state/lock" \\
#   -backend-config="unlock_address=https://example.com/state/lock"
`;
}

// Generate hints for local usage when a full remote backend is configured
function generateLocalBackendHints(backendType, provKey, platform) {
  let hints = '\n# --- ローカルからの terraform init 実行例 ---\n';

  if (backendType === 's3') {
    hints += `# terraform init はバックエンド設定が main.tf に記載済みのため、追加設定不要です。\n`;
    hints += `# 別環境へ切り替える場合:\n`;
    hints += `#   terraform init -reconfigure \\\n`;
    hints += `#     -backend-config="bucket=other-bucket" \\\n`;
    hints += `#     -backend-config="key=terraform/${provKey}/terraform.tfstate"\n`;
  } else if (backendType === 'gcs') {
    hints += `# terraform init はバックエンド設定が main.tf に記載済みのため、追加設定不要です。\n`;
    hints += `# 別環境へ切り替える場合:\n`;
    hints += `#   terraform init -reconfigure \\\n`;
    hints += `#     -backend-config="bucket=other-bucket" \\\n`;
    hints += `#     -backend-config="prefix=terraform/${provKey}"\n`;
  } else if (backendType === 'azurerm') {
    hints += `# terraform init はバックエンド設定が main.tf に記載済みのため、追加設定不要です。\n`;
    hints += `# 別環境へ切り替える場合:\n`;
    hints += `#   terraform init -reconfigure \\\n`;
    hints += `#     -backend-config="resource_group_name=other-rg" \\\n`;
    hints += `#     -backend-config="storage_account_name=otheraccount"\n`;
  } else if (backendType === 'cloud') {
    hints += `# HCP Terraform / Enterprise は cloud ブロックで設定済みです。\n`;
    hints += `# ローカルからの認証:\n`;
    hints += `#   terraform login\n`;
  }

  // CI/CD-specific hints
  if (platform === 'github') {
    hints += `#\n# GitHub Actions でローカルに保持する場合は、main.tf の backend ブロックを\n`;
    hints += `# 空ブロック (backend "http" {}) に変更し、CI/CD 側で -backend-config を指定します。\n`;
  } else if (platform === 'gitlab') {
    hints += `#\n# GitLab CI/CD でローカルに保持する場合は、main.tf の backend ブロックを\n`;
    hints += `# 空ブロック (backend "http" {}) に変更すると、GitLab が自動で環境変数を設定します。\n`;
  } else if (platform === 'bitbucket') {
    hints += `#\n# Bitbucket Pipelines でローカルに保持する場合は、main.tf の backend ブロックを\n`;
    hints += `# 空ブロック (backend "s3" {}) に変更し、Repository Variables から注入します。\n`;
  } else if (platform === 'circleci') {
    hints += `#\n# CircleCI でローカルに保持する場合は、main.tf の backend ブロックを\n`;
    hints += `# 空ブロック (backend "s3" {}) に変更し、-backend-config=backend.hcl で注入します。\n`;
  }

  return hints;
}

function generateVariablesTf(provider, cfg, provKey) {
  const env = state.namingStrategy.environment || 'dev';
  const varBase = `variable "environment" {
  description = "環境名 (例: dev, staging, prod)"
  type        = string
  default     = "${env}"
}

`;
  const varExtra = {
    aws: `variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}
`,
    gcp: `variable "gcp_project_id" {
  description = "GCPプロジェクトID"
  type        = string
}

variable "gcp_region" {
  description = "GCPリージョン"
  type        = string
  default     = "asia-northeast1"
}
`,
    azure: `variable "azure_location" {
  description = "Azureリージョン"
  type        = string
  default     = "Japaneast"
}
`,
    oci: `variable "tenancy_ocid" {
  description = "OCI Tenancy OCID"
  type        = string
}

variable "user_ocid" {
  description = "OCI User OCID"
  type        = string
}

variable "fingerprint" {
  description = "APIキーのフィンガープリント"
  type        = string
}

variable "private_key_path" {
  description = "秘密鍵のパス"
  type        = string
}

variable "region" {
  description = "OCIリージョン"
  type        = string
  default     = "ap-tokyo-1"
}
`,
    digitalocean: `variable "do_token" {
  description = "DigitalOcean APIトークン"
  type        = string
  sensitive   = true
}
`,
    alibaba: `variable "alicloud_region" {
  description = "Alibaba Cloudリージョン"
  type        = string
  default     = "ap-northeast-1"
}
`,
    panos: `variable "panos_hostname" {
  description = "PAN-OS ファイアウォールのホスト名またはIPアドレス (環境変数: PANOS_HOSTNAME)"
  type        = string
}

variable "panos_api_key" {
  description = "PAN-OS APIキー (環境変数: PANOS_API_KEY)"
  type        = string
  sensitive   = true
}

# Username/password authentication を使用する場合
# variable "panos_username" {
#   description = "PAN-OS ユーザー名 (環境変数: PANOS_USERNAME)"
#   type        = string
# }
#
# variable "panos_password" {
#   description = "PAN-OS パスワード (環境変数: PANOS_PASSWORD)"
#   type        = string
#   sensitive   = true
# }
`,
    fortios: `variable "fortios_hostname" {
  description = "FortiGate のホスト名またはIPアドレス (環境変数: FORTIOS_ACCESS_HOSTNAME)"
  type        = string
}

variable "fortios_token" {
  description = "FortiOS REST APIトークン (環境変数: FORTIOS_ACCESS_TOKEN)"
  type        = string
  sensitive   = true
}

variable "fortios_insecure" {
  description = "SSL証明書の検証をスキップするかどうか (環境変数: FORTIOS_INSECURE)"
  type        = string
  default     = "true"
}

# Username/password authentication を使用する場合
# variable "fortios_username" {
#   description = "FortiOS ユーザー名 (環境変数: FORTIOS_ACCESS_USERNAME)"
#   type        = string
# }
#
# variable "fortios_password" {
#   description = "FortiOS パスワード (環境変数: FORTIOS_ACCESS_PASSWORD)"
#   type        = string
#   sensitive   = true
# }
`,
    meraki: `variable "meraki_api_key" {
  description = "Meraki Dashboard APIキー (環境変数: MERAKI_API_KEY)"
  type        = string
  sensitive   = true
}
`,
    iosxe: `variable "iosxe_username" {
  description = "IOS-XE デバイスのユーザー名 (環境変数: IOSXE_USERNAME)"
  type        = string
}

variable "iosxe_password" {
  description = "IOS-XE デバイスのパスワード (環境変数: IOSXE_PASSWORD)"
  type        = string
  sensitive   = true
}

variable "iosxe_host" {
  description = "IOS-XE デバイスのホスト名またはIPアドレス (環境変数: IOSXE_HOST)"
  type        = string
}
`,
  };

  if (varExtra[provider]) {
    return varBase + varExtra[provider];
  }

  // Generic for custom providers
  const prov = state.providers.find(p => p.id === provider);
  const meta = prov?.registryMeta;

  if (meta?.variablesBlock) {
    return varBase + meta.variablesBlock + '\n';
  }

  return varBase + `variable "${provKey}_region" {
  description = "${provKey} リージョン"
  type        = string
  default     = "us-east-1"
}
`;
}

function generateMainTf(provider, cfg, provKey) {
  const mainHeader = `# ==============================================================================
# Main Terraform Configuration
# ==============================================================================

`;

  // Backend configuration block
  const backendBlock = generateBackendBlock(provKey);
  const backendSection = backendBlock + '\n';
  const mainResource = {
    aws: `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "main-vpc-\${var.environment}"
  }
}
`,
    gcp: `resource "google_compute_network" "vpc_network" {
  name                    = "main-network-\${var.environment}"
  auto_create_subnetworks = false
}
`,
    azure: `resource "azurerm_resource_group" "example" {
  name     = "rg-example-\${var.environment}"
  location = var.azure_location
}
`,
    oci: `resource "oci_core_vcn" "main_vcn" {
  compartment_id = var.tenancy_ocid
  cidr_block     = "10.0.0.0/16"
  display_name   = "main-vcn-\${var.environment}"
}
`,
    digitalocean: `resource "digitalocean_vpc" "main" {
  name     = "main-vpc-\${var.environment}"
  region   = "sgp1"
  ip_range = "10.10.10.0/24"
}
`,
    alibaba: `resource "alicloud_vpc" "main" {
  vpc_name   = "main-vpc-\${var.environment}"
  cidr_block = "10.0.0.0/8"
}
`,
    panos: `# PAN-OS Security Zone Example
# Note: PAN-OS provider v2.x uses auto-generated resources based on PAN-OS API specs
resource "panos_security_zone" "example" {
  location = {
    ngfw = {
      vsys = "vsys1"
    }
  }
  name = "terraform-zone-\${var.environment}"
}

# Additional examples:
# resource "panos_address_object" "example" {
#   location = {
#     ngfw = {
#       vsys = "vsys1"
#     }
#   }
#   name  = "example-server"
#   ip_netmask = "10.1.1.1/32"
# }
`,
    fortios: `# FortiGate Static Route Example
resource "fortios_router_static" "example" {
  seq_num = 1
  dst     = "10.0.0.0/24"
  gateway = "192.168.1.1"
  device  = "port1"
  comment = "Managed by Terraform - \${var.environment}"
}

# Firewall Address Example
# resource "fortios_firewall_address" "example" {
#   name    = "server-\${var.environment}"
#   type    = "ipmask"
#   subnet  = "10.1.1.0 255.255.255.0"
#   comment = "Managed by Terraform"
# }
`,
    meraki: `# Meraki Organization Data Source
data "meraki_organizations" "example" {
}

# Example: Retrieve organization networks
# data "meraki_networks" "example" {
#   organization_id = data.meraki_organizations.example.items[0].organization_id
# }

# Example: Create a network
# resource "meraki_network" "example" {
#   organization_id = data.meraki_organizations.example.items[0].organization_id
#   name            = "network-\${var.environment}"
#   product_types   = ["switch", "wireless"]
# }
`,
    iosxe: `# IOS-XE Loopback Interface Example
resource "iosxe_interface_loopback" "example" {
  name        = 100
  description = "Managed by Terraform - \${var.environment}"
  ipv4_address      = "10.100.0.1"
  ipv4_address_mask = "255.255.255.255"
  shutdown          = false
}

# Additional examples:
# resource "iosxe_interface_ethernet" "example" {
#   type = "GigabitEthernet"
#   name = "1"
#   description = "Managed by Terraform"
#   shutdown    = false
# }
`,
  };

  // Append extra scaffolded resources
  if (state.mainTfExtra) {
    return mainHeader + backendSection + (mainResource[provider] || `# ${provider} configuration`) + state.mainTfExtra;
  }

  if (mainResource[provider]) {
    return mainHeader + backendSection + mainResource[provider];
  }

  // Generic for custom providers
  const prov = state.providers.find(p => p.id === provider);
  const meta = prov?.registryMeta;

  if (meta?.resources && meta.resources.length > 0) {
    const resourceComments = meta.resources.map(r => {
      const resourceType = r.includes('_') ? `${provKey}_${r}` : r;
      return `# resource "${resourceType}" "example" {\n#   # See Terraform Registry for documentation\n# }`;
    }).join('\n\n');
    return mainHeader + backendSection + `# Available resources for ${provKey}:\n${resourceComments}\n`;
  }

  return mainHeader + backendSection + `# Add your ${provKey} resources below
# resource "${provKey}_example" "main" {
#   name = "example-\${var.environment}"
# }
`;
}

function generateCicdFile(platform, provider) {
  const steps = state.pipelineSteps;
  const cicdGenerators = { github: generateGitHub, gitlab: generateGitLab, bitbucket: generateBitbucket, circleci: generateCircleCI };
  const fn = cicdGenerators[platform];
  return fn ? fn(provider, steps) : null;
}

function generateGitHub(provider, steps) {
  const envHints = getGitHubEnvHints(provider);
  let stepLines = `
    - uses: actions/checkout@v3
    - uses: hashicorp/setup-terraform@v2
      with:
        terraform_version: "1.5.0"

    - name: Terraform Init
      run: terraform init
`;
  if (steps.fmt) {
    stepLines += `
    - name: Terraform Format
      run: terraform fmt -check
`;
  }
  if (steps.validate) {
    stepLines += `
    - name: Terraform Validate
      run: terraform validate -no-color
`;
  }

  // Quality & Security Tools
  if (state.securityTools.tflint) {
    stepLines += `
    - name: Setup TFLint
      uses: terraform-linters/setup-tflint@v3
    - name: TFLint
      run: tflint --recursive
`;
  }
  if (state.securityTools.tfsec) {
    stepLines += `
    - name: tfsec Scan
      uses: aquasecurity/tfsec-action@v1.0.0
`;
  }
  if (state.securityTools.infracost && steps.plan) {
    stepLines += `
    - name: Infracost
      uses: infracost/actions/setup@v2
      with:
        api_key: \${{ secrets.INFRACOST_API_KEY }} # TODO: GitHub Secrets に INFRACOST_API_KEY を設定してください
    - name: Generate Infracost estimate
      run: infracost breakdown --path . --format json --out-file /tmp/infracost.json
    - name: Post Infracost comment
      run: infracost comment github --path /tmp/infracost.json --repo \${{ github.repository }} --pull-request \${{ github.event.pull_request.number }} --behavior update
`;
  }

  if (steps.plan) {
    stepLines += `
    - name: Terraform Plan
      if: github.event_name == 'pull_request'
      run: terraform plan -no-color
`;
  }
  if (steps.apply) {
    if (state.applyManual) {
      stepLines += `
    - name: Terraform Apply
      if: github.ref == 'refs/heads/main' && github.event_name == 'push'
      run: terraform apply -auto-approve -input=false
      # NOTE: For manual approval, consider using GitHub Environments with required reviewers
`;
    } else {
      stepLines += `
    - name: Terraform Apply
      if: github.ref == 'refs/heads/main' && github.event_name == 'push'
      run: terraform apply -auto-approve -input=false
`;
    }
  }
  if (steps.destroy) {
    stepLines += `
    - name: Terraform Destroy
      if: github.ref == 'refs/heads/main' && github.event_name == 'push'
      run: terraform destroy -auto-approve -input=false
`;
    if (state.destroyManual) {
      stepLines = stepLines.replace(
        '- name: Terraform Destroy\n      if:',
        '- name: Terraform Destroy\n      # WARNING: Manual trigger recommended — use workflow_dispatch\n      if:'
      );
    }
  }

  // Build on triggers
  let onTrigger = `on:
  push:
    branches: [ "main" ]
  pull_request:`;
  if (steps.destroy && state.destroyManual) {
    onTrigger = `on:
  push:
    branches: [ "main" ]
  pull_request:
  workflow_dispatch:
    inputs:
      action:
        description: 'Action to perform'
        required: true
        default: 'plan'
        type: choice
        options:
          - plan
          - apply
          - destroy`;
  }

  const content = `name: 'Terraform CI/CD Pipeline'

${onTrigger}

jobs:
  terraform:
    name: 'Terraform'
    runs-on: ubuntu-latest
    env:${envHints}
      # Terraform HTTP Backend State (GitHub Secrets に設定してください)
      TF_HTTP_ADDRESS: \${{ secrets.TF_HTTP_ADDRESS }}
      TF_HTTP_LOCK_ADDRESS: \${{ secrets.TF_HTTP_LOCK_ADDRESS }}
      TF_HTTP_UNLOCK_ADDRESS: \${{ secrets.TF_HTTP_UNLOCK_ADDRESS }}
      TF_HTTP_USERNAME: \${{ secrets.TF_HTTP_USERNAME }}
      TF_HTTP_PASSWORD: \${{ secrets.TF_HTTP_PASSWORD }}
      TF_HTTP_LOCK_METHOD: "POST"
      TF_HTTP_UNLOCK_METHOD: "DELETE"

    steps:${stepLines}`;

  return { name: '.github/workflows/terraform.yml', language: 'yaml', content };
}

function generateGitLab(provider, steps) {
  const envHints = getGenericEnvHints(provider);
  const stages = [];
  if (steps.fmt || steps.validate || state.securityTools.tflint || state.securityTools.tfsec) stages.push('validate');
  if (state.securityTools.infracost && steps.plan) stages.push('cost');
  if (steps.plan) stages.push('plan');
  if (steps.apply) stages.push('apply');
  if (steps.destroy) stages.push('destroy');

  let jobs = '';

  if (steps.fmt || steps.validate || state.securityTools.tflint || state.securityTools.tfsec) {
    let script = '';
    if (steps.fmt) script += '    - terraform fmt -check\n';
    if (steps.validate) script += '    - terraform validate\n';

    if (state.securityTools.tflint) {
      script += '    - curl -s https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash\n';
      script += '    - tflint --init\n';
      script += '    - tflint --recursive\n';
    }
    if (state.securityTools.tfsec) {
      script += '    - curl -sSLo tfsec https://github.com/aquasecurity/tfsec/releases/latest/download/tfsec-linux-amd64\n';
      script += '    - chmod +x tfsec\n';
      script += '    - ./tfsec .\n';
    }

    jobs += `
validate:
  stage: validate
  script:
${script}`;
  }

  if (state.securityTools.infracost && steps.plan) {
    jobs += `
infracost:
  stage: cost
  script:
    - curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh
    - infracost breakdown --path . --format json --out-file infracost.json
    # TODO: GitLab CI/CD Variables に INFRACOST_API_KEY を設定してください
    - infracost comment gitlab --path infracost.json --repo $CI_PROJECT_PATH --merge-request $CI_MERGE_REQUEST_IID --behavior update
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
`;
  }

  if (steps.plan) {
    jobs += `
plan:
  stage: plan
  script:
    - terraform plan -out=tfplan
  artifacts:
    paths:
      - tfplan
`;
  }

  if (steps.apply) {
    const whenClause = state.applyManual ? '\n    when: manual' : '';
    const deps = steps.plan ? '\n  dependencies:\n    - plan' : '';
    jobs += `
apply:
  stage: apply
  script:
    - terraform apply -auto-approve${steps.plan ? ' tfplan' : ''}${deps}
  rules:
    - if: $CI_COMMIT_BRANCH == "main"${whenClause}
`;
  }

  if (steps.destroy) {
    const whenClause = state.destroyManual ? '\n    when: manual' : '';
    jobs += `
destroy:
  stage: destroy
  script:
    - terraform destroy -auto-approve
  rules:
    - if: $CI_COMMIT_BRANCH == "main"${whenClause}
  allow_failure: true
`;
  }

  const provKey = getProviderKey(provider);

  const content = `image:
  name: hashicorp/terraform:latest
  entrypoint: [""]

# Variables setup (Configure these in GitLab CI/CD Settings)${envHints}

# Terraform HTTP Backend State Management
# GitLab マネージド Terraform State を使用する場合:
#   Settings > General > Visibility > Terraform state を有効化してください
variables:
  TF_HTTP_ADDRESS: "$CI_API_V4_URL/projects/$CI_PROJECT_ID/terraform/state/${provKey}"
  TF_HTTP_LOCK_ADDRESS: "$CI_API_V4_URL/projects/$CI_PROJECT_ID/terraform/state/${provKey}/lock"
  TF_HTTP_UNLOCK_ADDRESS: "$CI_API_V4_URL/projects/$CI_PROJECT_ID/terraform/state/${provKey}/lock"
  TF_HTTP_USERNAME: "gitlab-ci-token"
  TF_HTTP_PASSWORD: "$CI_JOB_TOKEN"
  TF_HTTP_LOCK_METHOD: "POST"
  TF_HTTP_UNLOCK_METHOD: "DELETE"
  TF_HTTP_RETRY_WAIT_MIN: "5"

before_script:
  - terraform init

stages:
${stages.map(s => '  - ' + s).join('\n')}
${jobs}`;

  return { name: '.gitlab-ci.yml', language: 'yaml', content };
}

function generateBitbucket(provider, steps) {
  const envHints = getGenericEnvHints(provider);

  // Tools installation scripts
  const installTflint = '            - curl -s https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash\n';
  const installTfsec = '            - curl -sSLo tfsec https://github.com/aquasecurity/tfsec/releases/latest/download/tfsec-linux-amd64 && chmod +x tfsec\n';
  const installInfracost = '            - curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh\n';

  // PR pipeline steps
  let prSteps = '';
  if (steps.fmt || steps.validate || state.securityTools.tflint || state.securityTools.tfsec) {
    let script = '            - terraform init\n';
    if (steps.fmt) script += '            - terraform fmt -check\n';
    if (steps.validate) script += '            - terraform validate\n';

    if (state.securityTools.tflint) {
      script += installTflint;
      script += '            - tflint --init && tflint --recursive\n';
    }
    if (state.securityTools.tfsec) {
      script += installTfsec;
      script += '            - ./tfsec .\n';
    }

    prSteps += `      - step:
          name: Terraform Check & Security
          script:
${script}`;
  }

  if (state.securityTools.infracost && steps.plan) {
    prSteps += `      - step:
          name: Infracost
          script:
${installInfracost}            - infracost breakdown --path . --format json --out-file infracost.json
            # TODO: Bitbucket Repository Variables に INFRACOST_API_KEY を設定してください
            - infracost comment bitbucket --path infracost.json --repo $BITBUCKET_REPO_FULL_NAME --pull-request $BITBUCKET_PR_ID --behavior update
`;
  }
  if (steps.plan) {
    prSteps += `      - step:
          name: Terraform Plan
          script:
            - terraform init
            - terraform plan
`;
  }

  // Main branch steps
  let mainSteps = '';
  if (steps.plan) {
    mainSteps += `      - step:
          name: Terraform Plan
          script:
            - terraform init
            - terraform plan -out=tfplan
          artifacts:
            - tfplan
`;
  }
  if (steps.apply) {
    const trigger = state.applyManual ? '\n          trigger: manual' : '';
    mainSteps += `      - step:
          name: Terraform Apply${trigger}
          script:
            - terraform init
            - terraform apply -auto-approve${steps.plan ? ' tfplan' : ''}
`;
  }
  if (steps.destroy) {
    const trigger = state.destroyManual ? '\n          trigger: manual' : '';
    mainSteps += `      - step:
          name: Terraform Destroy${trigger}
          script:
            - terraform init
            - terraform destroy -auto-approve
`;
  }

  const provKey = getProviderKey(provider);

  const content = `image: hashicorp/terraform:light

# Configure these Repository Variables in Bitbucket Settings${envHints}

# Terraform S3 Backend State (Repository Variables に設定してください)
# AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY は上記 Credentials で設定済みの場合は不要
# TF_BACKEND_BUCKET: "my-tfstate-bucket"
# TF_BACKEND_KEY: "terraform/${provKey}/terraform.tfstate"
# TF_BACKEND_REGION: "ap-northeast-1"
#
# 各ステップの terraform init を以下に変更して利用できます:
#   terraform init \\
#     -backend-config="bucket=$TF_BACKEND_BUCKET" \\
#     -backend-config="key=$TF_BACKEND_KEY" \\
#     -backend-config="region=$TF_BACKEND_REGION" \\
#     -backend-config="encrypt=true"

pipelines:
  pull-requests:
    '**':
${prSteps}  branches:
    main:
${mainSteps}`;

  return { name: 'bitbucket-pipelines.yml', language: 'yaml', content };
}

function generateCircleCI(provider, steps) {
  const envHints = getGenericEnvHints(provider);
  let jobList = '';
  const prevJobs = [];

  // TFLint Job
  if (state.securityTools.tflint) {
    jobList += `      - tflint:
          context: terraform
`;
    prevJobs.push('tflint');
  }

  // tfsec Job
  if (state.securityTools.tfsec) {
    jobList += `      - tfsec:
          context: terraform
`;
    prevJobs.push('tfsec');
  }

  if (steps.fmt) {
    jobList += `      - terraform/fmt:
          checkout: true
`;
    prevJobs.push('terraform/fmt');
  }
  if (steps.validate) {
    const requires = prevJobs.length > 0 ? `\n          requires:\n            - ${prevJobs[prevJobs.length - 1]}` : '';
    jobList += `      - terraform/validate:
          checkout: true${requires}
`;
    prevJobs.push('terraform/validate');
  }
  if (steps.plan) {
    const requires = prevJobs.length > 0 ? `\n          requires:\n            - ${prevJobs[prevJobs.length - 1]}` : '';
    jobList += `      - terraform/plan:
          checkout: true${requires}
`;
    prevJobs.push('terraform/plan');
  }
  if (steps.apply) {
    const requires = prevJobs.length > 0 ? `\n          requires:\n            - ${prevJobs[prevJobs.length - 1]}` : '';
    const approval = state.applyManual ? `      - hold-apply:
          type: approval${requires}
` : '';
    const applyRequires = state.applyManual ? '\n          requires:\n            - hold-apply' : requires;
    if (approval) jobList += approval;
    jobList += `      - terraform/apply:
          checkout: true${applyRequires}
          filters:
            branches:
              only: main
`;
    prevJobs.push('terraform/apply');
  }
  if (steps.destroy) {
    const requires = prevJobs.length > 0 ? `\n          requires:\n            - ${prevJobs[prevJobs.length - 1]}` : '';
    const approval = state.destroyManual ? `      - hold-destroy:
          type: approval${requires}
` : '';
    const destroyRequires = state.destroyManual ? '\n          requires:\n            - hold-destroy' : requires;
    if (approval) jobList += approval;
    jobList += `      - terraform/destroy:
          checkout: true${destroyRequires}
          filters:
            branches:
              only: main
`;
  }

  if (state.securityTools.infracost && steps.plan) {
    const requires = prevJobs.length > 0 ? `\n          requires:\n            - ${prevJobs[prevJobs.length - 1]}` : '';
    jobList += `      - infracost:
          context: terraform${requires}
          filters:
            branches:
              ignore: main
`;
  }

  let jobDefinitions = '';
  if (state.securityTools.tflint) {
    jobDefinitions += `
  tflint:
    docker:
      - image: ghcr.io/terraform-linters/tflint:latest
    steps:
      - checkout
      - run: tflint --init
      - run: tflint --recursive
`;
  }
  if (state.securityTools.tfsec) {
    jobDefinitions += `
  tfsec:
    docker:
      - image: aquasecurity/tfsec:latest
    steps:
      - checkout
      - run: tfsec .
`;
  }
  if (state.securityTools.infracost) {
    jobDefinitions += `
  infracost:
    docker:
      - image: infracost/infracost:latest
    steps:
      - checkout
      - run:
          name: Infracost
          command: |
            # TODO: CircleCI Project Settings -> Environment Variables に INFRACOST_API_KEY を設定してください
            infracost breakdown --path . --format json --out-file infracost.json
            infracost comment circleci --path infracost.json --repo $CIRCLE_PROJECT_REPONAME --pull-request $CIRCLE_PULL_REQUEST --behavior update
`;
  }

  const provKey = getProviderKey(provider);

  const content = `version: 2.1

# Configure Environment Variables in CircleCI Project Settings${envHints}
#
# Terraform S3 Backend State (Project Settings > Environment Variables に設定):
#   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (上記 Credentials で設定済みの場合は不要)
#   TF_CLI_ARGS_init: "-backend-config=bucket=my-tfstate-bucket -backend-config=key=terraform/${provKey}/terraform.tfstate -backend-config=region=ap-northeast-1 -backend-config=encrypt=true"
#
# または backend.hcl ファイルを使用する場合:
#   TF_CLI_ARGS_init: "-backend-config=backend.hcl"

orbs:
  terraform: circleci/terraform@3.2.1

jobs:${jobDefinitions}

workflows:
  plan_and_apply:
    jobs:
${jobList}`;

  return { name: '.circleci/config.yml', language: 'yaml', content };
}

function getGitHubEnvHints(provider) {
  const map = {
    aws: `
      # AWS Credentials
      AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
      AWS_REGION: "ap-northeast-1"`,
    gcp: `
      # GCP Credentials
      GOOGLE_CREDENTIALS: \${{ secrets.GOOGLE_CREDENTIALS }}`,
    azure: `
      # Azure Credentials
      ARM_CLIENT_ID: \${{ secrets.ARM_CLIENT_ID }}
      ARM_CLIENT_SECRET: \${{ secrets.ARM_CLIENT_SECRET }}
      ARM_SUBSCRIPTION_ID: \${{ secrets.ARM_SUBSCRIPTION_ID }}
      ARM_TENANT_ID: \${{ secrets.ARM_TENANT_ID }}`,
    oci: `
      # OCI Credentials
      TF_VAR_tenancy_ocid: \${{ secrets.TF_VAR_tenancy_ocid }}
      TF_VAR_user_ocid: \${{ secrets.TF_VAR_user_ocid }}
      TF_VAR_fingerprint: \${{ secrets.TF_VAR_fingerprint }}
      TF_VAR_private_key_path: \${{ secrets.TF_VAR_private_key_path }}`,
    digitalocean: `
      # DigitalOcean Token
      DIGITALOCEAN_TOKEN: \${{ secrets.DIGITALOCEAN_TOKEN }}`,
    alibaba: `
      # Alibaba Cloud Credentials
      ALICLOUD_ACCESS_KEY: \${{ secrets.ALICLOUD_ACCESS_KEY }}
      ALICLOUD_SECRET_KEY: \${{ secrets.ALICLOUD_SECRET_KEY }}`,
    panos: `
      # Palo Alto PAN-OS Credentials
      PANOS_HOSTNAME: \${{ secrets.PANOS_HOSTNAME }}
      PANOS_API_KEY: \${{ secrets.PANOS_API_KEY }}`,
    fortios: `
      # FortiOS Credentials
      FORTIOS_ACCESS_HOSTNAME: \${{ secrets.FORTIOS_ACCESS_HOSTNAME }}
      FORTIOS_ACCESS_TOKEN: \${{ secrets.FORTIOS_ACCESS_TOKEN }}
      FORTIOS_INSECURE: "true"`,
    meraki: `
      # Cisco Meraki Credentials
      MERAKI_DASHBOARD_API_KEY: \${{ secrets.MERAKI_DASHBOARD_API_KEY }}`,
    iosxe: `
      # Cisco IOS-XE Credentials
      IOSXE_HOST: \${{ secrets.IOSXE_HOST }}
      IOSXE_USERNAME: \${{ secrets.IOSXE_USERNAME }}
      IOSXE_PASSWORD: \${{ secrets.IOSXE_PASSWORD }}`,
  };
  if (map[provider]) return map[provider];

  // Custom provider: generate from variables found in registry meta
  const prov = state.providers.find(p => p.id === provider);
  const meta = prov?.registryMeta;
  const provKey = getProviderKey(provider);

  let hints = `\n      # ${provKey.toUpperCase()} Credentials`;

  if (meta?.variablesBlock) {
    // Extract variable names from the block
    const varNames = [];
    const regex = /variable\s+"([^"]+)"/g;
    let m;
    while ((m = regex.exec(meta.variablesBlock)) !== null) {
      varNames.push(m[1]);
    }

    if (varNames.length > 0) {
      varNames.forEach(v => {
        hints += `\n      TF_VAR_${v}: \${{ secrets.TF_VAR_${v.toUpperCase()} }}`;
      });
      return hints;
    }
  }

  // Default fallback
  return hints + `\n      # ${provKey.toUpperCase()}_API_KEY: \${{ secrets.${provKey.toUpperCase()}_API_KEY }}`;
}

function getGenericEnvHints(provider) {
  const map = {
    aws: `
  # AWS Credentials
  # AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
  # AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
  # AWS_REGION: "ap-northeast-1"`,
    gcp: `
  # GCP Credentials
  # GOOGLE_CREDENTIALS: $GOOGLE_CREDENTIALS`,
    azure: `
  # Azure Credentials
  # ARM_CLIENT_ID: $ARM_CLIENT_ID
  # ARM_CLIENT_SECRET: $ARM_CLIENT_SECRET
  # ARM_SUBSCRIPTION_ID: $ARM_SUBSCRIPTION_ID
  # ARM_TENANT_ID: $ARM_TENANT_ID`,
    oci: `
  # OCI Credentials
  # TF_VAR_tenancy_ocid: $TF_VAR_tenancy_ocid
  # TF_VAR_user_ocid: $TF_VAR_user_ocid
  # TF_VAR_fingerprint: $TF_VAR_fingerprint
  # TF_VAR_private_key_path: $TF_VAR_private_key_path`,
    digitalocean: `
  # DigitalOcean Token
  # DIGITALOCEAN_TOKEN: $DIGITALOCEAN_TOKEN`,
    alibaba: `
  # Alibaba Cloud Credentials
  # ALICLOUD_ACCESS_KEY: $ALICLOUD_ACCESS_KEY
  # ALICLOUD_SECRET_KEY: $ALICLOUD_SECRET_KEY`,
    panos: `
  # Palo Alto PAN-OS Credentials
  # PANOS_HOSTNAME: $PANOS_HOSTNAME
  # PANOS_API_KEY: $PANOS_API_KEY`,
    fortios: `
  # FortiOS Credentials
  # FORTIOS_ACCESS_HOSTNAME: $FORTIOS_ACCESS_HOSTNAME
  # FORTIOS_ACCESS_TOKEN: $FORTIOS_ACCESS_TOKEN
  # FORTIOS_INSECURE: "true"`,
    meraki: `
  # Cisco Meraki Credentials
  # MERAKI_DASHBOARD_API_KEY: $MERAKI_DASHBOARD_API_KEY`,
    iosxe: `
  # Cisco IOS-XE Credentials
  # IOSXE_HOST: $IOSXE_HOST
  # IOSXE_USERNAME: $IOSXE_USERNAME
  # IOSXE_PASSWORD: $IOSXE_PASSWORD`,
  };
  if (map[provider]) return map[provider];

  // Custom provider: generate from variables found in registry meta
  const prov = state.providers.find(p => p.id === provider);
  const meta = prov?.registryMeta;
  const provKey = getProviderKey(provider);

  let hints = `\n  # ${provKey.toUpperCase()} Credentials`;

  if (meta?.variablesBlock) {
    const varNames = [];
    const regex = /variable\s+"([^"]+)"/g;
    let m;
    while ((m = regex.exec(meta.variablesBlock)) !== null) {
      varNames.push(m[1]);
    }

    if (varNames.length > 0) {
      varNames.forEach(v => {
        hints += `\n  # TF_VAR_${v}: $TF_VAR_${v.toUpperCase()}`;
      });
      return hints;
    }
  }

  return hints + `\n  # ${provKey.toUpperCase()}_API_KEY: $${provKey.toUpperCase()}_API_KEY`;
}
