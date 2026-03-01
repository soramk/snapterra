/* ==========================================================================
   Terraform Boilerplate Generator — Application Logic
   ========================================================================== */

// ============================================================
// Data Definitions
// ============================================================

const ICONS = {
  github: `<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>`,
  gitlab: `<path d="m22 13.29-3.33-10a.42.42 0 0 0-.14-.18.38.38 0 0 0-.22-.11.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18l-2.26 6.67H8.32L6.1 3.26a.42.42 0 0 0-.1-.18.38.38 0 0 0-.26-.08.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18L2 13.29a.74.74 0 0 0 .27.83L12 21l9.69-6.88a.71.71 0 0 0 .31-.83Z"/>`,
  gitBranch: `<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>`,
  circleDashed: `<path d="M10.1 2.182a10 10 0 0 1 3.8 0"/><path d="M13.9 21.818a10 10 0 0 1-3.8 0"/><path d="M17.609 3.721a10 10 0 0 1 2.69 2.7"/><path d="M21.818 10.1a10 10 0 0 1 0 3.8"/><path d="M2.182 13.9a10 10 0 0 1 0-3.8"/><path d="M3.721 6.391a10 10 0 0 1 2.7-2.69"/><path d="M20.279 17.609a10 10 0 0 1-2.7 2.69"/><path d="M6.391 20.279a10 10 0 0 1-2.69-2.7"/>`,
  fileCode: `<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>`,
  x: `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
};

function makeSvg(paths, size = 24) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

const PLATFORMS = [
  { id: 'github', name: 'GitHub Actions', icon: ICONS.github, colorClass: 'platform-card--github' },
  { id: 'gitlab', name: 'GitLab CI', icon: ICONS.gitlab, colorClass: 'platform-card--gitlab' },
  { id: 'bitbucket', name: 'Bitbucket', icon: ICONS.gitBranch, colorClass: 'platform-card--bitbucket' },
  { id: 'circleci', name: 'CircleCI', icon: ICONS.circleDashed, colorClass: 'platform-card--circleci' },
];

// Preset providers with their default source/version and template data
const PRESET_PROVIDERS = [
  { id: 'aws', name: 'Amazon Web Services', source: 'hashicorp/aws', version: '~> 5.0', isPreset: true },
  { id: 'gcp', name: 'Google Cloud', source: 'hashicorp/google', version: '~> 5.0', isPreset: true },
  { id: 'azure', name: 'Microsoft Azure', source: 'hashicorp/azurerm', version: '~> 3.0', isPreset: true },
  { id: 'oci', name: 'Oracle Cloud (OCI)', source: 'oracle/oci', version: '~> 5.0', isPreset: true },
  { id: 'digitalocean', name: 'DigitalOcean', source: 'digitalocean/digitalocean', version: '~> 2.0', isPreset: true },
  { id: 'alibaba', name: 'Alibaba Cloud', source: 'aliyun/alicloud', version: '~> 1.0', isPreset: true },
  { id: 'panos', name: 'Palo Alto (PAN-OS)', source: 'PaloAltoNetworks/panos', version: '~> 2.0', isPreset: true },
  { id: 'fortios', name: 'FortiOS', source: 'fortinetdev/fortios', version: '~> 1.24', isPreset: true },
  { id: 'meraki', name: 'Cisco Meraki', source: 'CiscoDevNet/meraki', version: '~> 1.9', isPreset: true },
  { id: 'iosxe', name: 'Cisco IOS-XE', source: 'CiscoDevNet/iosxe', version: '~> 0.16', isPreset: true },
];

// ============================================================
// State
// ============================================================
// Pipeline step definitions
const PIPELINE_STEPS = [
  { id: 'fmt', label: 'Format Check', desc: 'terraform fmt -check', defaultOn: true },
  { id: 'validate', label: 'Validate', desc: 'terraform validate', defaultOn: true },
  { id: 'plan', label: 'Plan', desc: 'terraform plan', defaultOn: true },
  { id: 'apply', label: 'Apply', desc: 'terraform apply -auto-approve', defaultOn: true },
  { id: 'destroy', label: 'Destroy', desc: 'terraform destroy -auto-approve', defaultOn: false },
];

let state = {
  platform: 'github',
  provider: 'aws',
  activeFile: '',
  // Providers list (can be extended by user)
  providers: PRESET_PROVIDERS.map(p => ({ ...p })),
  // Provider overrides: { [providerId]: { source, version } }
  providerOverrides: {},
  // Pipeline config
  pipelineSteps: {
    fmt: true,
    validate: true,
    plan: true,
    apply: true,
    destroy: false,
  },
  applyManual: false,
  destroyManual: true,
};

// ============================================================
// State Persistence (localStorage)
// ============================================================
const STORAGE_KEY = 'snapterra_state';

function saveState() {
  try {
    const toSave = {
      platform: state.platform,
      provider: state.provider,
      customProviders: state.providers.filter(p => !p.isPreset),
      providerOverrides: state.providerOverrides,
      pipelineSteps: state.pipelineSteps,
      applyManual: state.applyManual,
      destroyManual: state.destroyManual,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    // localStorage may be unavailable (private browsing, quota exceeded, etc.)
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);

    // Restore platform & provider selection
    if (saved.platform) state.platform = saved.platform;
    if (saved.provider) state.provider = saved.provider;

    // Restore custom providers (merge with presets)
    if (Array.isArray(saved.customProviders)) {
      const customProviders = saved.customProviders.map(p => ({ ...p, isPreset: false }));
      state.providers = [
        ...PRESET_PROVIDERS.map(p => ({ ...p })),
        ...customProviders,
      ];
    }

    // Restore provider overrides
    if (saved.providerOverrides && typeof saved.providerOverrides === 'object') {
      state.providerOverrides = saved.providerOverrides;
    }

    // Restore pipeline config
    if (saved.pipelineSteps && typeof saved.pipelineSteps === 'object') {
      state.pipelineSteps = { ...state.pipelineSteps, ...saved.pipelineSteps };
    }
    if (typeof saved.applyManual === 'boolean') state.applyManual = saved.applyManual;
    if (typeof saved.destroyManual === 'boolean') state.destroyManual = saved.destroyManual;

    // Validate that the saved provider still exists
    if (!state.providers.find(p => p.id === state.provider)) {
      state.provider = state.providers[0]?.id || 'aws';
    }
  } catch (e) {
    // If parsing fails, use default state
  }
}

// Restore state from localStorage on load
loadState();

// Helper to get effective source/version for a provider
function getProviderConfig(providerId) {
  const prov = state.providers.find(p => p.id === providerId);
  if (!prov) return { source: '', version: '' };
  const override = state.providerOverrides[providerId];
  return {
    source: override?.source ?? prov.source,
    version: override?.version ?? prov.version,
  };
}

// Helper to get provider name key (the last part of source, e.g. "aws" from "hashicorp/aws")
function getProviderKey(providerId) {
  const cfg = getProviderConfig(providerId);
  const parts = cfg.source.split('/');
  return parts[parts.length - 1] || providerId;
}

// ============================================================
// Terraform Registry API Integration
// ============================================================
const REGISTRY_API = 'https://registry.terraform.io';
const CORS_PROXY = 'https://api.codetabs.com/v1/proxy/?quest=';

async function fetchWithProxy(url) {
  const res = await fetch(CORS_PROXY + encodeURIComponent(url));
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

async function fetchRegistryData(source) {
  const parts = source.split('/');
  if (parts.length !== 2) return null;
  const [namespace, providerName] = parts;

  try {
    // 1. Find provider and get latest version
    const searchData = await fetchWithProxy(`${REGISTRY_API}/v2/providers?filter[namespace]=${encodeURIComponent(namespace)}&filter[name]=${encodeURIComponent(providerName)}`);
    const providerData = searchData.data?.[0];
    if (!providerData) return null;
    const providerId = providerData.id;

    // 2. Get versions to find latest
    const versionsData = await fetchWithProxy(`${REGISTRY_API}/v1/providers/${encodeURIComponent(namespace)}/${encodeURIComponent(providerName)}/versions`);
    const versions = (versionsData.versions || [])
      .map(v => v.version)
      .filter(v => !v.includes('-'))
      .sort((a, b) => {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
          if ((pa[i] || 0) !== (pb[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
        }
        return 0;
      });
    const latestVersion = versions[0] || null;

    // 3. Get provider with versions to find latest version ID
    let provData;
    try {
      provData = await fetchWithProxy(`${REGISTRY_API}/v2/providers/${providerId}?include=provider-versions`);
    } catch (e) {
      return { latestVersion, description: providerData.attributes?.description || '' };
    }

    // Find latest version ID
    const included = provData.included || [];
    const latestVersionData = latestVersion
      ? included.find(v => v.attributes?.version === latestVersion)
      : included.sort((a, b) => new Date(b.attributes?.['published-at'] || 0) - new Date(a.attributes?.['published-at'] || 0))[0];

    if (!latestVersionData) return { latestVersion, description: providerData.attributes?.description || '' };

    // 4. Get docs for the latest version (to find overview)
    let docsData;
    try {
      docsData = await fetchWithProxy(`${REGISTRY_API}/v2/provider-versions/${latestVersionData.id}?include=provider-docs`);
    } catch (e) {
      return { latestVersion, description: providerData.attributes?.description || '' };
    }

    // Find overview doc
    const docsIncluded = docsData.included || [];
    const overviewDoc = docsIncluded.find(d => d.attributes?.category === 'overview');
    const resourceDocs = docsIncluded.filter(d => d.attributes?.category === 'resources').map(d => d.attributes?.title || d.attributes?.slug);

    let providerBlock = '';
    let variablesBlock = '';
    let exampleUsage = '';

    if (overviewDoc) {
      // 5. Fetch overview doc content
      try {
        const contentData = await fetchWithProxy(`${REGISTRY_API}/v2/provider-docs/${overviewDoc.id}`);
        const content = contentData.data?.attributes?.content || '';

        // Parse Example Usage
        exampleUsage = extractExampleUsage(content);

        // Parse provider block
        providerBlock = extractProviderBlock(content, providerName);

        // Parse variables from content
        variablesBlock = extractVariables(content, providerName);
      } catch (e) {
        // Ignore doc fetching error
      }
    }

    return {
      latestVersion,
      description: latestVersionData.attributes?.description || providerData.attributes?.description || '',
      providerBlock,
      variablesBlock,
      exampleUsage,
      resources: resourceDocs.slice(0, 5), // Top 5 resources
    };
  } catch (e) {
    console.warn('Registry API fetch failed:', e);
    return null;
  }
}

function extractExampleUsage(markdown) {
  const match = markdown.match(/## Example Usage[\s\S]*?```(?:terraform|hcl)\n([\s\S]*?)```/);
  return match ? match[1].trim() : '';
}

function extractProviderBlock(markdown, providerName) {
  // Try to extract provider block from example
  const content = extractExampleUsage(markdown);
  if (!content) return '';

  // Find provider "name" { ... } block
  const provRegex = new RegExp(`provider\\s+"${providerName}"\\s*\\{[\\s\\S]*?\\}`, 'g');
  const match = content.match(provRegex);
  return match ? match[0] : '';
}

function extractVariables(markdown, providerName) {
  // 1. First try to extract variable blocks from example usage
  const exampleContent = extractExampleUsage(markdown);
  if (exampleContent) {
    const varRegex = /variable\s+"[^"]+"\s*\{[\s\S]*?\}/g;
    const matches = exampleContent.match(varRegex);
    if (matches && matches.length > 0) {
      return matches.join('\n\n');
    }
  }

  // 2. Fallback: Parse Argument Reference section
  let argsSection = '';
  const argMatch = markdown.match(/## Argument Reference([\s\S]*?)(?:##|$)/i);
  if (argMatch) {
    argsSection = argMatch[1];
  } else {
    // Try Schema section
    const schemaMatch = markdown.match(/## Schema([\s\S]*?)(?:##|$)/i);
    if (schemaMatch) {
      argsSection = schemaMatch[1];
    }
  }

  if (!argsSection) return '';

  // Look for list items like "- `token` - (Required, string) ..."
  const itemRegex = /-\s+`([a-zA-Z0-9_-]+)`\s+-\s+\(([^)]*)\)(.*)/g;
  const variables = [];
  let match;
  let count = 0;

  while ((match = itemRegex.exec(argsSection)) !== null && count < 5) {
    const name = match[1];
    const reqTag = match[2].toLowerCase();

    // desc might have markdown links, let's keep it simple
    const desc = match[3].trim().replace(/"/g, '\\"').substring(0, 100);

    const isRequired = reqTag.includes('required');

    // Add prefix if name doesn't already have one
    const varName = name.startsWith(providerName) ? name : `${providerName}_${name}`;

    let varBlock = `variable "${varName}" {\n`;
    varBlock += `  description = "${desc}"\n`;
    varBlock += `  type        = string\n`;

    const isSensitive = reqTag.includes('sensitive') || name.includes('token') || name.includes('password') || name.includes('secret') || name.includes('key');
    if (isSensitive) {
      varBlock += `  sensitive   = true\n`;
    }
    if (!isRequired) {
      varBlock += `  default     = ""\n`;
    }
    varBlock += `}`;

    variables.push(varBlock);
    count++; // Max 5 variables to keep it clean
  }

  return variables.join('\n\n');
}


// ============================================================
// DOM References
// ============================================================
const $platformGrid = document.getElementById('platform-grid');
const $providerList = document.getElementById('provider-list');
const $fileTabs = document.getElementById('file-tabs');
const $activeFileName = document.getElementById('active-file-name');
const $codeDisplay = document.getElementById('code-display');
const $btnCopy = document.getElementById('btn-copy');
const $copyIcon = document.getElementById('copy-icon');
const $checkIcon = document.getElementById('check-icon');
const $copyLabel = document.getElementById('copy-label');
const $btnDownloadFile = document.getElementById('btn-download-file');
const $btnDownloadAll = document.getElementById('btn-download-all');
const $btnAddProvider = document.getElementById('btn-add-provider');
const $btnFetchRegistry = document.getElementById('btn-fetch-registry');
const $registryBtnLabel = document.getElementById('registry-btn-label');
const $providerConfig = document.getElementById('provider-config');
const $pipelineConfig = document.getElementById('pipeline-config');
const $modalOverlay = document.getElementById('modal-overlay');
const $modalClose = document.getElementById('modal-close');
const $modalCancel = document.getElementById('modal-cancel');
const $modalSubmit = document.getElementById('modal-submit');

// ============================================================
// File Generation Logic
// ============================================================

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
  # backend "s3" { ... }
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
  # backend "gcs" { ... }
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
  # backend "azurerm" { ... }
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
  # backend "http" { ... }
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
  # backend "s3" { ... } # Spaces uses S3 compatible backend
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
  # backend configuration here
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
  # backend configuration here
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
  # backend configuration here
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
  # backend configuration here
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
  # backend configuration here
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
    providerBlockStr = `\nprovider "${provKey}" {\n  # Configure your provider settings here\n  # region = var.region\n}\n`;
  }

  return `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    ${provKey} = {
      source  = "${cfg.source}"
      version = "${cfg.version}"
    }
  }
  # backend configuration here
}
${providerBlockStr}`;
}

function generateVariablesTf(provider, cfg, provKey) {
  const varBase = `variable "environment" {
  description = "環境名 (例: dev, staging, prod)"
  type        = string
  default     = "dev"
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

  if (mainResource[provider]) {
    return mainHeader + mainResource[provider];
  }

  // Generic for custom providers
  const prov = state.providers.find(p => p.id === provider);
  const meta = prov?.registryMeta;

  if (meta?.resources && meta.resources.length > 0) {
    const resourceComments = meta.resources.map(r => {
      const resourceType = r.includes('_') ? `${provKey}_${r}` : r;
      return `# resource "${resourceType}" "example" {\n#   # See Terraform Registry for documentation\n# }`;
    }).join('\n\n');
    return mainHeader + `# Available resources for ${provKey}:\n${resourceComments}\n`;
  }

  return mainHeader + `# Add your ${provKey} resources below
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

    steps:${stepLines}`;

  return { name: '.github/workflows/terraform.yml', language: 'yaml', content };
}

function generateGitLab(provider, steps) {
  const envHints = getGenericEnvHints(provider);
  const stages = [];
  if (steps.fmt || steps.validate) stages.push('validate');
  if (steps.plan) stages.push('plan');
  if (steps.apply) stages.push('apply');
  if (steps.destroy) stages.push('destroy');

  let jobs = '';

  if (steps.fmt || steps.validate) {
    let script = '';
    if (steps.fmt) script += '    - terraform fmt -check\n';
    if (steps.validate) script += '    - terraform validate\n';
    jobs += `
validate:
  stage: validate
  script:
${script}`;
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

  const content = `image: hashicorp/terraform:light

# Variables setup (Configure these in GitLab CI/CD Settings)${envHints}

before_script:
  - terraform init

stages:
${stages.map(s => '  - ' + s).join('\n')}
${jobs}`;

  return { name: '.gitlab-ci.yml', language: 'yaml', content };
}

function generateBitbucket(provider, steps) {
  const envHints = getGenericEnvHints(provider);

  // PR pipeline steps
  let prSteps = '';
  if (steps.fmt || steps.validate) {
    let script = '            - terraform init\n';
    if (steps.fmt) script += '            - terraform fmt -check\n';
    if (steps.validate) script += '            - terraform validate\n';
    prSteps += `      - step:
          name: Terraform Format and Validate
          script:
${script}`;
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

  const content = `image: hashicorp/terraform:light

# Configure these Repository Variables in Bitbucket Settings${envHints}

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

  const content = `version: 2.1

# Configure Environment Variables in CircleCI Project Settings${envHints}

orbs:
  terraform: circleci/terraform@3.2.1

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
  // Custom provider: generic hint
  const provKey = getProviderKey(provider);
  return `
      # ${provKey.toUpperCase()} Credentials
      # ${provKey.toUpperCase()}_API_KEY: \${{ secrets.${provKey.toUpperCase()}_API_KEY }}`;
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
  const provKey = getProviderKey(provider);
  return `
  # ${provKey.toUpperCase()} Credentials
  # ${provKey.toUpperCase()}_API_KEY: $${provKey.toUpperCase()}_API_KEY`;
}

// ============================================================
// Syntax Highlighting
// ============================================================

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightCode(code, language) {
  const escaped = escapeHtml(code);
  const lines = escaped.split('\n');
  const highlighted = lines.map(line => {
    if (language === 'plaintext') return line;

    if (/^\s*#/.test(line)) {
      return `<span class="hl-comment">${line}</span>`;
    }

    if (language === 'yaml') {
      return line.replace(
        /^(\s*)([\w\-./]+)(:)/g,
        '$1<span class="hl-attr">$2</span><span class="hl-bracket">$3</span>'
      ).replace(
        /(&quot;[^&]*&quot;)/g,
        '<span class="hl-string">$1</span>'
      ).replace(
        /('([^']*)')/g,
        '<span class="hl-string">$1</span>'
      ).replace(
        /(\$\{\{[^}]*\}\})/g,
        '<span class="hl-value">$1</span>'
      );
    }

    if (language === 'hcl') {
      let result = line;
      result = result.replace(
        /(&quot;[^&]*&quot;)/g,
        '<span class="hl-string">$1</span>'
      );
      result = result.replace(
        /\b(terraform|required_version|required_providers|provider|resource|variable|output|data|module|locals|backend|source|version|type|default|description|sensitive|features)\b/g,
        '<span class="hl-keyword">$1</span>'
      );
      result = result.replace(
        /([{}[\]])/g,
        '<span class="hl-bracket">$1</span>'
      );
      if (/^#\s*={3,}/.test(line)) {
        return `<span class="hl-section">${line}</span>`;
      }
      return result;
    }

    return line;
  });

  return highlighted.join('\n');
}

// ============================================================
// Rendering
// ============================================================

function renderPlatforms() {
  $platformGrid.innerHTML = PLATFORMS.map(plat => {
    const isActive = state.platform === plat.id;
    const classes = [
      'platform-card',
      plat.colorClass,
      isActive ? 'platform-card--active' : '',
    ].filter(Boolean).join(' ');

    return `
      <button class="${classes}" data-platform="${plat.id}" id="platform-${plat.id}" type="button">
        <span class="platform-card__icon">${makeSvg(plat.icon, 32)}</span>
        <span class="platform-card__label">${plat.name}</span>
      </button>
    `;
  }).join('');
}

function renderProviders() {
  $providerList.innerHTML = state.providers.map(prov => {
    const isActive = state.provider === prov.id;
    const classes = [
      'provider-item',
      isActive ? 'provider-item--active' : '',
    ].filter(Boolean).join(' ');

    const badge = prov.isPreset
      ? '<span class="provider-item__badge">Preset</span>'
      : '<span class="provider-item__badge">Custom</span>';

    const deleteBtn = !prov.isPreset
      ? `<button class="provider-item__delete" data-delete-provider="${prov.id}" type="button" title="削除" aria-label="削除">${makeSvg(ICONS.x, 14)}</button>`
      : '';

    return `
      <div class="${classes}" data-provider="${prov.id}" id="provider-${prov.id}" role="radio" tabindex="0" aria-checked="${isActive}">
        <span class="provider-item__radio">
          <span class="provider-item__radio-dot"></span>
        </span>
        <span class="provider-item__label">${escapeHtml(prov.name)}</span>
        ${badge}
        ${deleteBtn}
      </div>
    `;
  }).join('');
}

function renderProviderConfig() {
  const prov = state.providers.find(p => p.id === state.provider);
  if (!prov) {
    $providerConfig.innerHTML = '';
    return;
  }

  const cfg = getProviderConfig(state.provider);

  $providerConfig.innerHTML = `
    <div class="provider-config__field">
      <label class="provider-config__label" for="cfg-source">Source</label>
      <input class="provider-config__input" type="text" id="cfg-source" value="${escapeHtml(cfg.source)}" data-config="source" autocomplete="off" />
    </div>
    <div class="provider-config__field">
      <label class="provider-config__label" for="cfg-version">Version</label>
      <input class="provider-config__input" type="text" id="cfg-version" value="${escapeHtml(cfg.version)}" data-config="version" autocomplete="off" />
    </div>
  `;
}

function renderFileTabs(files) {
  $fileTabs.innerHTML = files.map(file => {
    const isActive = state.activeFile === file.name;
    const classes = [
      'file-tab',
      isActive ? 'file-tab--active' : '',
    ].filter(Boolean).join(' ');

    return `
      <button class="${classes}" data-file="${file.name}" id="tab-${file.name.replace(/[/.]/g, '-')}" type="button">
        <span class="file-tab__icon">${makeSvg(ICONS.fileCode, 16)}</span>
        ${file.name}
      </button>
    `;
  }).join('');
}

function renderCode(files) {
  const file = files.find(f => f.name === state.activeFile);
  if (!file) return;

  $activeFileName.textContent = file.name;
  $codeDisplay.innerHTML = highlightCode(file.content, file.language);
}

function renderPipelineConfig() {
  const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  let html = '<div class="pipeline-separator__label">実行ステップ</div>';

  PIPELINE_STEPS.forEach(step => {
    const isChecked = state.pipelineSteps[step.id];
    const checkedClass = isChecked ? 'pipeline-step--checked' : 'pipeline-step--unchecked';
    html += `
      <div class="pipeline-step ${checkedClass}" data-step="${step.id}" id="step-${step.id}">
        <span class="pipeline-step__checkbox">${checkIcon}</span>
        <span class="pipeline-step__info">
          <span class="pipeline-step__label">${step.label}</span>
          <span class="pipeline-step__desc">${step.desc}</span>
        </span>
      </div>`;
  });

  // Toggles section
  html += '<div class="pipeline-separator"></div>';
  html += '<div class="pipeline-separator__label">実行モード</div>';

  // Apply manual toggle (only show if apply is enabled)
  if (state.pipelineSteps.apply) {
    const applyOn = state.applyManual;
    html += `
      <div class="pipeline-toggle" data-toggle="applyManual" id="toggle-apply-manual">
        <span class="pipeline-toggle__info">
          <span class="pipeline-toggle__label">Apply を手動実行</span>
          <span class="pipeline-toggle__desc">${applyOn ? '手動トリガーが必要' : '自動で実行'}</span>
        </span>
        <span class="toggle-switch ${applyOn ? 'toggle-switch--on' : ''}"></span>
      </div>`;
  }

  // Destroy manual toggle (only show if destroy is enabled)
  if (state.pipelineSteps.destroy) {
    const destroyOn = state.destroyManual;
    html += `
      <div class="pipeline-toggle" data-toggle="destroyManual" id="toggle-destroy-manual">
        <span class="pipeline-toggle__info">
          <span class="pipeline-toggle__label">Destroy を手動実行</span>
          <span class="pipeline-toggle__desc">${destroyOn ? '手動トリガーが必要（推奨）' : '自動で実行（注意）'}</span>
        </span>
        <span class="toggle-switch toggle-switch--danger ${destroyOn ? 'toggle-switch--on' : ''}"></span>
      </div>`;
  }

  $pipelineConfig.innerHTML = html;
}

function render() {
  const files = generateFiles(state.platform, state.provider);

  if (!files.find(f => f.name === state.activeFile)) {
    state.activeFile = files[0]?.name || '';
  }

  renderPlatforms();
  renderPipelineConfig();
  renderProviders();
  renderProviderConfig();
  renderFileTabs(files);
  renderCode(files);

  // Show/hide Registry fetch button for custom providers
  const currentProv = state.providers.find(p => p.id === state.provider);
  if (currentProv && !currentProv.isPreset) {
    $btnFetchRegistry.classList.remove('hidden');
    $registryBtnLabel.textContent = currentProv.registryMeta ? '更新' : 'Registry';
  } else {
    $btnFetchRegistry.classList.add('hidden');
  }

  saveState();
}

// ============================================================
// Event Handling
// ============================================================

// Platform selection
$platformGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.platform-card');
  if (!card) return;
  const newPlatform = card.dataset.platform;
  if (newPlatform && newPlatform !== state.platform) {
    state.platform = newPlatform;
    render();
  }
});

// Pipeline section collapse/expand
document.getElementById('pipeline-toggle-header').addEventListener('click', () => {
  const content = document.getElementById('pipeline-config');
  const chevron = document.getElementById('pipeline-chevron');
  content.classList.toggle('hidden');
  chevron.classList.toggle('config-section__chevron--open');
});

// Pipeline step checkboxes
$pipelineConfig.addEventListener('click', (e) => {
  const stepEl = e.target.closest('.pipeline-step');
  if (stepEl) {
    const stepId = stepEl.dataset.step;
    if (stepId && stepId in state.pipelineSteps) {
      state.pipelineSteps[stepId] = !state.pipelineSteps[stepId];
      render();
    }
    return;
  }

  const toggleEl = e.target.closest('.pipeline-toggle');
  if (toggleEl) {
    const toggleId = toggleEl.dataset.toggle;
    if (toggleId === 'applyManual') {
      state.applyManual = !state.applyManual;
      render();
    } else if (toggleId === 'destroyManual') {
      state.destroyManual = !state.destroyManual;
      render();
    }
  }
});

// Provider selection (ignore clicks on the delete button)
$providerList.addEventListener('click', (e) => {
  // Handle delete button clicks
  const deleteBtn = e.target.closest('.provider-item__delete');
  if (deleteBtn) {
    e.stopPropagation();
    const idToDelete = deleteBtn.dataset.deleteProvider;
    if (!idToDelete) return;
    const prov = state.providers.find(p => p.id === idToDelete);
    if (prov && !prov.isPreset) {
      showConfirmDialog(
        `「${prov.name}」を削除しますか？`,
        'このプロバイダーに関連する設定も削除されます。この操作は元に戻せません。',
        () => {
          state.providers = state.providers.filter(p => p.id !== idToDelete);
          delete state.providerOverrides[idToDelete];
          if (state.provider === idToDelete) {
            state.provider = state.providers[0]?.id || '';
          }
          render();
        }
      );
    }
    return;
  }

  const item = e.target.closest('.provider-item');
  if (!item) return;
  const newProvider = item.dataset.provider;
  if (newProvider && newProvider !== state.provider) {
    state.provider = newProvider;
    render();
  }
});

// Keyboard handling for provider radio items
$providerList.addEventListener('keydown', (e) => {
  const item = e.target.closest('.provider-item');
  if (!item) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const newProvider = item.dataset.provider;
    if (newProvider && newProvider !== state.provider) {
      state.provider = newProvider;
      render();
    }
  }
});

// Provider config input changes (live update)
$providerConfig.addEventListener('input', (e) => {
  const input = e.target.closest('.provider-config__input');
  if (!input) return;
  const field = input.dataset.config; // 'source' or 'version'
  if (!field) return;

  if (!state.providerOverrides[state.provider]) {
    const prov = state.providers.find(p => p.id === state.provider);
    state.providerOverrides[state.provider] = {
      source: prov?.source || '',
      version: prov?.version || '',
    };
  }
  state.providerOverrides[state.provider][field] = input.value;

  // Re-render code (but not the config inputs to avoid cursor jump)
  const files = generateFiles(state.platform, state.provider);
  if (!files.find(f => f.name === state.activeFile)) {
    state.activeFile = files[0]?.name || '';
  }
  renderFileTabs(files);
  renderCode(files);
  saveState();
});

// Fetch from Terraform Registry
$btnFetchRegistry.addEventListener('click', async () => {
  const prov = state.providers.find(p => p.id === state.provider);
  if (!prov || prov.isPreset) return;

  const cfg = getProviderConfig(state.provider);
  const source = cfg.source;

  // Show loading state
  $btnFetchRegistry.classList.add('btn-action--loading');
  $btnFetchRegistry.disabled = true;
  $registryBtnLabel.textContent = '取得中...';

  try {
    const registryData = await fetchRegistryData(source);
    if (registryData) {
      prov.registryMeta = registryData;

      // Update version if latest is available
      if (registryData.latestVersion) {
        const majorMinor = registryData.latestVersion.split('.').slice(0, 2).join('.');
        const newVersion = `~> ${majorMinor}`;
        prov.version = newVersion;
        if (!state.providerOverrides[state.provider]) {
          state.providerOverrides[state.provider] = { source, version: newVersion };
        } else {
          state.providerOverrides[state.provider].version = newVersion;
        }
      }

      // Show success
      $registryBtnLabel.textContent = '取得完了';
      setTimeout(() => {
        $registryBtnLabel.textContent = '更新';
      }, 2000);

      render();
    } else {
      $registryBtnLabel.textContent = '取得失敗';
      setTimeout(() => {
        $registryBtnLabel.textContent = prov.registryMeta ? '更新' : 'Registry';
      }, 2000);
    }
  } catch (e) {
    console.warn('Registry fetch failed:', e);
    $registryBtnLabel.textContent = 'エラー';
    setTimeout(() => {
      $registryBtnLabel.textContent = prov.registryMeta ? '更新' : 'Registry';
    }, 2000);
  }

  $btnFetchRegistry.classList.remove('btn-action--loading');
  $btnFetchRegistry.disabled = false;
});

// File tab selection
$fileTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.file-tab');
  if (!tab) return;
  const fileName = tab.dataset.file;
  if (fileName && fileName !== state.activeFile) {
    state.activeFile = fileName;
    const files = generateFiles(state.platform, state.provider);
    renderFileTabs(files);
    renderCode(files);
  }
});

// Copy to clipboard
let copyTimeout = null;
$btnCopy.addEventListener('click', () => {
  const files = generateFiles(state.platform, state.provider);
  const file = files.find(f => f.name === state.activeFile);
  if (!file) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(file.content).then(() => showCopiedFeedback()).catch(() => fallbackCopy(file.content));
  } else {
    fallbackCopy(file.content);
  }
});

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showCopiedFeedback();
  } catch (err) {
    console.error('Copy failed', err);
  }
  document.body.removeChild(ta);
}

function showCopiedFeedback() {
  $btnCopy.classList.add('btn-action--copied');
  $copyIcon.classList.add('hidden');
  $checkIcon.classList.remove('hidden');
  $copyLabel.textContent = 'Copied!';

  if (copyTimeout) clearTimeout(copyTimeout);
  copyTimeout = setTimeout(() => {
    $btnCopy.classList.remove('btn-action--copied');
    $copyIcon.classList.remove('hidden');
    $checkIcon.classList.add('hidden');
    $copyLabel.textContent = 'Copy';
  }, 2000);
}

// ============================================================
// Download Functionality
// ============================================================

function downloadSingleFile(fileName, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  // For files with paths like ".github/workflows/terraform.yml", use the basename
  const baseName = fileName.split('/').pop();
  a.href = url;
  a.download = baseName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Minimal ZIP implementation (no external dependencies)
// Creates a valid ZIP file using the store method (no compression needed for small text files)
function createZipBlob(files) {
  const entries = [];
  let offset = 0;

  // Encode each file
  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const contentBytes = new TextEncoder().encode(file.content);

    // Local file header (30 bytes + name length)
    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const lhView = new DataView(localHeader);
    lhView.setUint32(0, 0x04034b50, true);  // Local file header signature
    lhView.setUint16(4, 20, true);           // Version needed to extract
    lhView.setUint16(6, 0x0800, true);       // General purpose bit flag (UTF-8)
    lhView.setUint16(8, 0, true);            // Compression method (stored)
    lhView.setUint16(10, 0, true);           // Last mod file time
    lhView.setUint16(12, 0, true);           // Last mod file date
    lhView.setUint32(14, crc32(contentBytes), true); // CRC-32
    lhView.setUint32(18, contentBytes.length, true);  // Compressed size
    lhView.setUint32(22, contentBytes.length, true);  // Uncompressed size
    lhView.setUint16(26, nameBytes.length, true);     // File name length
    lhView.setUint16(28, 0, true);           // Extra field length
    new Uint8Array(localHeader).set(nameBytes, 30);

    entries.push({
      nameBytes,
      contentBytes,
      localHeaderOffset: offset,
      crc: crc32(contentBytes),
    });

    offset += localHeader.byteLength + contentBytes.length;
  }

  // Build central directory
  const centralDirectory = [];
  for (const entry of entries) {
    const cdh = new ArrayBuffer(46 + entry.nameBytes.length);
    const cdView = new DataView(cdh);
    cdView.setUint32(0, 0x02014b50, true);   // Central directory file header signature
    cdView.setUint16(4, 20, true);            // Version made by
    cdView.setUint16(6, 20, true);            // Version needed to extract
    cdView.setUint16(8, 0x0800, true);        // General purpose bit flag (UTF-8)
    cdView.setUint16(10, 0, true);            // Compression method
    cdView.setUint16(12, 0, true);            // Last mod file time
    cdView.setUint16(14, 0, true);            // Last mod file date
    cdView.setUint32(16, entry.crc, true);    // CRC-32
    cdView.setUint32(20, entry.contentBytes.length, true); // Compressed size
    cdView.setUint32(24, entry.contentBytes.length, true); // Uncompressed size
    cdView.setUint16(28, entry.nameBytes.length, true);    // File name length
    cdView.setUint16(30, 0, true);            // Extra field length
    cdView.setUint16(32, 0, true);            // File comment length
    cdView.setUint16(34, 0, true);            // Disk number start
    cdView.setUint16(36, 0, true);            // Internal file attributes
    cdView.setUint32(38, 0, true);            // External file attributes
    cdView.setUint32(42, entry.localHeaderOffset, true); // Relative offset
    new Uint8Array(cdh).set(entry.nameBytes, 46);
    centralDirectory.push(cdh);
  }

  const cdSize = centralDirectory.reduce((sum, cd) => sum + cd.byteLength, 0);

  // End of central directory record
  const eocd = new ArrayBuffer(22);
  const eocdView = new DataView(eocd);
  eocdView.setUint32(0, 0x06054b50, true);   // EOCD signature
  eocdView.setUint16(4, 0, true);             // Number of this disk
  eocdView.setUint16(6, 0, true);             // Central directory disk
  eocdView.setUint16(8, entries.length, true); // Total entries on this disk
  eocdView.setUint16(10, entries.length, true);// Total entries
  eocdView.setUint32(12, cdSize, true);        // Central directory size
  eocdView.setUint32(16, offset, true);        // Central directory offset
  eocdView.setUint16(20, 0, true);             // Comment length

  // Combine all parts
  const parts = [];
  for (let i = 0; i < entries.length; i++) {
    // Local header
    const nameBytes = entries[i].nameBytes;
    const contentBytes = entries[i].contentBytes;
    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const lhView = new DataView(localHeader);
    lhView.setUint32(0, 0x04034b50, true);
    lhView.setUint16(4, 20, true);
    lhView.setUint16(6, 0x0800, true);
    lhView.setUint16(8, 0, true);
    lhView.setUint16(10, 0, true);
    lhView.setUint16(12, 0, true);
    lhView.setUint32(14, entries[i].crc, true);
    lhView.setUint32(18, contentBytes.length, true);
    lhView.setUint32(22, contentBytes.length, true);
    lhView.setUint16(26, nameBytes.length, true);
    lhView.setUint16(28, 0, true);
    new Uint8Array(localHeader).set(nameBytes, 30);
    parts.push(new Uint8Array(localHeader));
    parts.push(contentBytes);
  }
  for (const cd of centralDirectory) {
    parts.push(new Uint8Array(cd));
  }
  parts.push(new Uint8Array(eocd));

  return new Blob(parts, { type: 'application/zip' });
}

// CRC-32 calculation
function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Download single file button
$btnDownloadFile.addEventListener('click', () => {
  const files = generateFiles(state.platform, state.provider);
  const file = files.find(f => f.name === state.activeFile);
  if (!file) return;
  downloadSingleFile(file.name, file.content);
});

// Download all as ZIP button
$btnDownloadAll.addEventListener('click', () => {
  const files = generateFiles(state.platform, state.provider);
  const zipBlob = createZipBlob(files);
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'terraform-boilerplate.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ============================================================
// Custom Provider Modal
// ============================================================

function openModal() {
  $modalOverlay.classList.remove('hidden');
  // Clear fields
  document.getElementById('custom-provider-id').value = '';
  document.getElementById('custom-provider-name').value = '';
  document.getElementById('custom-provider-source').value = '';
  document.getElementById('custom-provider-version').value = '~> 1.0';
  // Reset guide accordion
  const guideContent = document.getElementById('guide-content');
  const guideChevron = document.getElementById('guide-chevron');
  if (guideContent) guideContent.classList.add('hidden');
  if (guideChevron) guideChevron.classList.remove('registry-guide__chevron--open');
  // Clear previous errors
  document.querySelectorAll('.form-error').forEach(el => el.remove());
  document.querySelectorAll('.form-input--error').forEach(el => el.classList.remove('form-input--error'));
  // Focus first field
  setTimeout(() => document.getElementById('custom-provider-id').focus(), 100);
}

function closeModal() {
  $modalOverlay.classList.add('hidden');
}

async function submitCustomProvider() {
  const idInput = document.getElementById('custom-provider-id');
  const nameInput = document.getElementById('custom-provider-name');
  const sourceInput = document.getElementById('custom-provider-source');
  const versionInput = document.getElementById('custom-provider-version');

  const id = idInput.value.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
  const name = nameInput.value.trim();
  const source = sourceInput.value.trim();
  const version = versionInput.value.trim() || '~> 1.0';

  // Validation
  let hasError = false;

  // Clear previous errors
  document.querySelectorAll('.form-error').forEach(el => el.remove());
  document.querySelectorAll('.form-input--error').forEach(el => el.classList.remove('form-input--error'));

  if (!id) {
    showFieldError(idInput, 'プロバイダーIDを入力してください');
    hasError = true;
  } else if (state.providers.find(p => p.id === id)) {
    showFieldError(idInput, 'このIDは既に使用されています');
    hasError = true;
  }

  if (!name) {
    showFieldError(nameInput, '表示名を入力してください');
    hasError = true;
  }

  if (!source) {
    showFieldError(sourceInput, 'ソースを入力してください');
    hasError = true;
  }

  if (hasError) return;

  // Show loading state on submit button
  const submitBtn = document.getElementById('modal-submit');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = '取得中...';
  submitBtn.disabled = true;

  // Add the custom provider immediately
  const newProvider = {
    id,
    name,
    source,
    version,
    isPreset: false,
  };
  state.providers.push(newProvider);

  // Auto-select the new provider
  state.provider = id;
  closeModal();
  render();

  // Fetch Registry data in the background
  try {
    const registryData = await fetchRegistryData(source);
    if (registryData) {
      // Update provider with registry metadata
      const prov = state.providers.find(p => p.id === id);
      if (prov) {
        prov.registryMeta = registryData;

        // Auto-update version if latest is available and user left default
        if (registryData.latestVersion && version === '~> 1.0') {
          const majorMinor = registryData.latestVersion.split('.').slice(0, 2).join('.');
          prov.version = `~> ${majorMinor}`;
          // Also update override
          if (!state.providerOverrides[id]) {
            state.providerOverrides[id] = { source, version: prov.version };
          } else {
            state.providerOverrides[id].version = prov.version;
          }
        }

        render();
      }
    }
  } catch (e) {
    // Silently fail — generic templates will be used
    console.warn('Failed to fetch registry data:', e);
  }

  // Restore button
  submitBtn.textContent = originalText;
  submitBtn.disabled = false;
}

function showConfirmDialog(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-dialog__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
        </div>
        <div class="confirm-dialog__title">${title}</div>
        <div class="confirm-dialog__message">${message}</div>
        <div class="confirm-dialog__actions">
          <button class="btn-modal btn-modal--cancel" id="confirm-cancel" type="button">キャンセル</button>
          <button class="btn-modal btn-modal--submit" style="background: var(--red-500); border-color: var(--red-500);" id="confirm-delete" type="button">削除</button>
        </div>
      </div>
    `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  overlay.querySelector('#confirm-cancel').addEventListener('click', close);
  overlay.querySelector('#confirm-delete').addEventListener('click', () => {
    close();
    onConfirm();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Escape to cancel
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function showFieldError(input, message) {
  input.classList.add('form-input--error');
  const errorEl = document.createElement('span');
  errorEl.className = 'form-error';
  errorEl.textContent = message;
  input.parentElement.appendChild(errorEl);
}

$btnAddProvider.addEventListener('click', openModal);
$modalClose.addEventListener('click', closeModal);
$modalCancel.addEventListener('click', closeModal);
$modalSubmit.addEventListener('click', submitCustomProvider);

// Close modal on overlay click (outside modal)
$modalOverlay.addEventListener('click', (e) => {
  if (e.target === $modalOverlay) closeModal();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$modalOverlay.classList.contains('hidden')) {
    closeModal();
  }
});

// Submit modal on Enter key in inputs
document.getElementById('modal-add-provider').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitCustomProvider();
  }
});

// Guide accordion toggle
document.getElementById('guide-toggle').addEventListener('click', () => {
  const content = document.getElementById('guide-content');
  const chevron = document.getElementById('guide-chevron');
  content.classList.toggle('hidden');
  chevron.classList.toggle('registry-guide__chevron--open');
});

// ============================================================
// Initial Render
// ============================================================
render();
saveState(); // Save initial state (including any restored data)
