/* ==========================================================================
   Terraform Boilerplate Generator — DOM References & Rendering
   ========================================================================== */

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
const $registryInfoSection = document.getElementById('registry-info-section');
const $registryInfo = document.getElementById('registry-info');
const $pipelineConfig = document.getElementById('pipeline-config');
const $securityToolsConfig = document.getElementById('security-tools-config');
const $backendConfig = document.getElementById('backend-config');
const $namingConfig = document.getElementById('naming-config');
const $namingPrefixInput = document.getElementById('naming-prefix');
const $namingEnvInput = document.getElementById('naming-env');
const $modalOverlay = document.getElementById('modal-overlay');
const $modalClose = document.getElementById('modal-close');
const $modalCancel = document.getElementById('modal-cancel');
const $modalSubmit = document.getElementById('modal-submit');

// ============================================================
// Rendering Functions
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

function renderSecurityToolsConfig() {
  let html = '<div class="pipeline-separator"></div>';
  html += '<div class="pipeline-separator__label">品質・セキュリティ</div>';

  SECURITY_STEPS.forEach(tool => {
    const isChecked = state.securityTools[tool.id];
    html += `
      <div class="pipeline-toggle" data-tool="${tool.id}" id="tool-${tool.id}">
        <span class="pipeline-toggle__info">
          <span class="pipeline-toggle__label">${tool.label}</span>
          <span class="pipeline-toggle__desc">${tool.desc}</span>
        </span>
        <span class="toggle-switch ${isChecked ? 'toggle-switch--on' : ''}"></span>
      </div>`;
  });

  $securityToolsConfig.innerHTML = html;
}

function renderNamingConfig() {
  $namingPrefixInput.value = state.namingStrategy.prefix;
  $namingEnvInput.value = state.namingStrategy.environment;
}

function renderBackendConfig() {
  let html = '<div class="backend-type-grid">';

  BACKEND_TYPES.forEach(type => {
    const isActive = state.backend.type === type.id;
    html += `
      <div class="backend-type-card ${isActive ? 'backend-type-card--active' : ''}" data-type="${type.id}">
        <div class="backend-type-card__label">${type.label}</div>
        <div class="backend-type-card__desc">${type.desc}</div>
      </div>
    `;
  });
  html += '</div>';

  const t = state.backend.type;
  if (t !== 'local') {
    html += '<div class="backend-fields">';
    if (t === 's3') {
      html += renderBackendField('bucket', 'S3 Bucket Name', 'example-terraform-state');
      html += renderBackendField('region', 'AWS Region', 'ap-northeast-1');
    } else if (t === 'gcs') {
      html += renderBackendField('bucket', 'GCS Bucket Name', 'example-terraform-state');
    } else if (t === 'azurerm') {
      html += renderBackendField('resourceGroup', 'Resource Group', 'rg-terraform');
      html += renderBackendField('storageAccount', 'Storage Account', 'stterraformstate');
    } else if (t === 'cloud') {
      html += renderBackendField('organization', 'HCP Org Name', 'my-org');
      html += renderBackendField('workspace', 'Workspace Name', 'my-app-prod');
    }
    html += '</div>';
  }

  $backendConfig.innerHTML = html;
}

function renderBackendField(id, label, placeholder) {
  return `
    <div class="form-group-compact">
      <label class="form-label-compact">${label}</label>
      <input class="form-input-compact backend-input" type="text" data-field="${id}" value="${state.backend[id] || ''}" placeholder="${placeholder}" />
    </div>
  `;
}

function renderRegistryInfo() {
  const prov = state.providers.find(p => p.id === state.provider);
  const meta = prov?.registryMeta;

  if (!meta) {
    $registryInfoSection.classList.add('hidden');
    return;
  }

  $registryInfoSection.classList.remove('hidden');

  let html = '';

  // Resources section (Now clickable for scaffolding)
  if (meta.resources && meta.resources.length > 0) {
    html += `
      <div class="registry-info__group">
        <div class="registry-info__label">即時挿入可能なリソース (Click to add)</div>
        <div class="registry-info__tags">
          ${meta.resources.map(r => `
            <button class="registry-info__tag registry-info__tag--resource scaffold-trigger" data-resource="${escapeHtml(r)}" title="main.tf に雛形を挿入">
              ${escapeHtml(r)}
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:2px"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Variables section
  if (meta.variablesBlock) {
    const varNames = [];
    const regex = /variable\s+"([^"]+)"/g;
    let m;
    while ((m = regex.exec(meta.variablesBlock)) !== null) {
      varNames.push(m[1]);
    }

    if (varNames.length > 0) {
      html += `
        <div class="registry-info__group">
          <div class="registry-info__label">検出された環境変数候補</div>
          <div class="registry-info__tags">
            ${varNames.map(v => `<span class="registry-info__tag">${escapeHtml(v)}</span>`).join('')}
          </div>
        </div>
      `;
    }
  }

  // Description
  if (meta.description) {
    html += `
      <div class="registry-info__group">
        <div class="registry-info__label">説明</div>
        <div class="registry-info__desc">${escapeHtml(meta.description.substring(0, 150))}${meta.description.length > 150 ? '...' : ''}</div>
      </div>
    `;
  }

  // External Links
  const cfg = getProviderConfig(state.provider);
  html += `
    <div class="registry-info__links">
      <a class="registry-info__link" href="https://registry.terraform.io/providers/${cfg.source}/latest/docs" target="_blank" rel="noopener">
        Registry ドキュメントを表示
        ${makeSvg(ICONS.externalLink, 12)}
      </a>
    </div>
  `;

  $registryInfo.innerHTML = html;
}

function render() {
  const files = generateFiles(state.platform, state.provider);

  if (!files.find(f => f.name === state.activeFile)) {
    state.activeFile = files[0]?.name || '';
  }

  renderPlatforms();
  renderPipelineConfig();
  renderSecurityToolsConfig();
  renderNamingConfig();
  renderProviders();
  renderProviderConfig();
  renderBackendConfig();
  renderRegistryInfo();
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
