/* ==========================================================================
   Terraform Boilerplate Generator — Custom Provider Modal & Confirm Dialog
   ========================================================================== */

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
