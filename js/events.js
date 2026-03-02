/* ==========================================================================
   Terraform Boilerplate Generator — Event Handling & Initialization
   ========================================================================== */

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
// Sidebar Accordions
setupAccordion('pipeline-toggle-header', 'pipeline-config', 'pipeline-chevron');
setupAccordion('naming-toggle-header', 'naming-config', 'naming-chevron');
setupAccordion('backend-toggle-header', 'backend-config', 'backend-chevron');

// Pipeline & Security Events
$pipelineConfig.addEventListener('click', (e) => {
    const stepEl = e.target.closest('.pipeline-step');
    if (stepEl && stepEl.dataset.step) {
        const stepId = stepEl.dataset.step;
        state.pipelineSteps[stepId] = !state.pipelineSteps[stepId];
        render();
        return;
    }

    const toggleEl = e.target.closest('.pipeline-toggle');
    if (toggleEl) {
        const toggleId = toggleEl.dataset.toggle;
        if (toggleId in state) {
            state[toggleId] = !state[toggleId];
            render();
        }
    }
});

document.getElementById('security-tools-config').addEventListener('click', (e) => {
    const toggleEl = e.target.closest('.pipeline-toggle');
    if (toggleEl && toggleEl.dataset.tool) {
        toggleSecurityTool(toggleEl.dataset.tool);
    }
});

// Naming Strategy Events
document.getElementById('naming-config').addEventListener('input', (e) => {
    const id = e.target.id;
    if (id === 'naming-prefix') state.namingStrategy.prefix = e.target.value;
    if (id === 'naming-env') state.namingStrategy.environment = e.target.value;
    saveState();
    render();
});

// Backend Config Events
document.getElementById('backend-config').addEventListener('click', (e) => {
    const card = e.target.closest('.backend-type-card');
    if (card) {
        state.backend.type = card.dataset.type;
        saveState();
        render();
    }
});

document.getElementById('backend-config').addEventListener('input', (e) => {
    const input = e.target.closest('.backend-input');
    if (input) {
        state.backend[input.dataset.field] = e.target.value;
        saveState();
        render();
    }
});

// Resource Scaffolding
document.getElementById('registry-info').addEventListener('click', (e) => {
    const trigger = e.target.closest('.scaffold-trigger');
    if (trigger) {
        insertResourceScaffold(trigger.dataset.resource);
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
// Custom Provider Modal Event Bindings
// ============================================================

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
// ============================================================// ============================================================
// Helper Functions
// ============================================================

function setupAccordion(headerId, contentId, chevronId) {
    const $header = document.getElementById(headerId);
    const $content = document.getElementById(contentId);
    const $chevron = document.getElementById(chevronId);

    if (!$header || !$content || !$chevron) return;

    $header.addEventListener('click', () => {
        const isHidden = $content.classList.contains('hidden');
        if (isHidden) {
            $content.classList.remove('hidden');
            $sectionHeaderVisible($content, true); // Extra UI logic if needed
            $chevron.classList.add('config-section__chevron--open');
        } else {
            $content.classList.add('hidden');
            $chevron.classList.remove('config-section__chevron--open');
        }
    });
}

// Special hook for dynamic sections
function $sectionHeaderVisible(el, visible) {
    if (el.id === 'security-tools-config') {
        const $sec = document.getElementById('security-tools-config');
        if (visible) $sec.classList.remove('hidden');
    }
}

function toggleSecurityTool(id) {
    state.securityTools[id] = !state.securityTools[id];
    saveState();
    render();
}

/**
 * Insert resource boilerplate into the main code area
 */
function insertResourceScaffold(resourceType) {
    // Switch to main.tf if not already there
    state.activeFile = 'main.tf';

    // Naming logic
    const prefix = state.namingStrategy.prefix || 'example';
    const env = state.namingStrategy.environment || 'dev';
    const name = `${prefix}-${env}`;

    const scaffold = `
# Added from Registry Scaffolding
resource "${resourceType}" "this" {
  # TODO: Configure resource arguments
  name = "${name}"
}
`;

    if (!state.mainTfExtra) state.mainTfExtra = '';
    state.mainTfExtra += scaffold;

    saveState();
    render();
}

// Initial Render
render();
saveState();
