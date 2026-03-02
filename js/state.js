/* ==========================================================================
   Terraform Boilerplate Generator — State Management
   ========================================================================== */

// ============================================================
// State
// ============================================================

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
    // Naming strategy
    namingStrategy: {
        prefix: 'snapterra',
        environment: 'dev',
        useEnvironmentInName: true,
    },
    // Backend config
    backend: {
        type: 'local',
        bucket: '',
        region: 'ap-northeast-1',
        resourceGroup: '',
        storageAccount: '',
        organization: '',
        workspace: '',
    },
    // Security / Checks steps
    securityTools: SECURITY_STEPS.reduce((acc, tool) => {
        acc[tool.id] = tool.defaultOn || false;
        return acc;
    }, {}),
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
            namingStrategy: state.namingStrategy,
            backend: state.backend,
            securityTools: state.securityTools,
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

        // Restore naming strategy
        if (saved.namingStrategy && typeof saved.namingStrategy === 'object') {
            state.namingStrategy = { ...state.namingStrategy, ...saved.namingStrategy };
        }

        // Restore backend config
        if (saved.backend && typeof saved.backend === 'object') {
            state.backend = { ...state.backend, ...saved.backend };
        }

        // Restore security tools
        if (saved.securityTools && typeof saved.securityTools === 'object') {
            state.securityTools = { ...state.securityTools, ...saved.securityTools };
        }

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
