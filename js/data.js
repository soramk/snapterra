/* ==========================================================================
   Terraform Boilerplate Generator — Data Definitions
   ========================================================================== */

// ============================================================
// Icon SVG Paths
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

// ============================================================
// Platform & Provider Definitions
// ============================================================

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

// Pipeline step definitions
const PIPELINE_STEPS = [
    { id: 'fmt', label: 'Terraform Format', desc: 'コードの整形 (terraform fmt)', defaultOn: true },
    { id: 'validate', label: 'Terraform Validate', desc: '構文チェック (terraform validate)', defaultOn: true },
    { id: 'plan', label: 'Terraform Plan', desc: '実行計画の作成 (terraform plan)', defaultOn: true },
    { id: 'apply', label: 'Terraform Apply', desc: 'リソースの作成・変更 (terraform apply)', defaultOn: true },
    { id: 'destroy', label: 'Terraform Destroy', desc: 'リソースの削除 (terraform destroy)', defaultOn: false },
];

const BACKEND_TYPES = [
    { id: 'local', label: 'Local', desc: 'ローカル (デフォルト)' },
    { id: 's3', label: 'S3', desc: 'AWS S3 + DynamoDB' },
    { id: 'gcs', label: 'GCS', desc: 'Google Cloud Storage' },
    { id: 'azurerm', label: 'Azure Blob', desc: 'Azure Storage Account' },
    { id: 'cloud', label: 'HCP Cloud', desc: 'HCP Terraform / Enterprise' },
];

const SECURITY_STEPS = [
    { id: 'tflint', label: 'TFLint', desc: '静的解析・ベストプラクティス (Best Practices)', defaultOn: false },
    { id: 'tfsec', label: 'tfsec', desc: 'セキュリティスキャン (Security Scanning)', defaultOn: false },
    { id: 'infracost', label: 'Infracost', desc: 'コスト予測 (Cost Estimation)', defaultOn: false },
];
