/* ==========================================================================
   Terraform Boilerplate Generator — Terraform Registry API Integration
   ========================================================================== */

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
        const searchData = await fetchWithProxy(
            `${REGISTRY_API}/v2/providers?filter[namespace]=${encodeURIComponent(namespace)}&filter[name]=${encodeURIComponent(providerName)}`
        );
        const providerData = searchData.data?.[0];
        if (!providerData) return null;
        const providerId = providerData.id;

        // 2. Get versions to find latest
        const versionsData = await fetchWithProxy(
            `${REGISTRY_API}/v1/providers/${encodeURIComponent(namespace)}/${encodeURIComponent(providerName)}/versions`
        );
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

        // 4. Get docs for the latest version
        let docsData;
        try {
            docsData = await fetchWithProxy(`${REGISTRY_API}/v2/provider-versions/${latestVersionData.id}?include=provider-docs`);
        } catch (e) {
            return { latestVersion, description: providerData.attributes?.description || '' };
        }

        const docsIncluded = docsData.included || [];
        const overviewDoc = docsIncluded.find(d => d.attributes?.category === 'overview');
        const resourceDocs = docsIncluded.filter(d => d.attributes?.category === 'resources')
            .map(d => d.attributes?.title || d.attributes?.slug);

        // ── NEW: Find guide docs related to authentication/configuration ──
        const AUTH_KEYWORDS = [
            'authentication', 'auth', 'getting-started', 'getting_started',
            'configuration', 'config', 'credential', 'setup',
        ];
        const guideDocs = docsIncluded
            .filter(d => {
                if (d.attributes?.category !== 'guides') return false;
                const slug = (d.attributes?.slug || '').toLowerCase();
                const title = (d.attributes?.title || '').toLowerCase();
                return AUTH_KEYWORDS.some(kw => slug.includes(kw) || title.includes(kw));
            })
            // Sort: prefer "authentication" or "getting-started" docs first
            .sort((a, b) => {
                const scoreSlug = (slug) => {
                    if (slug.includes('authentication') || slug.includes('auth')) return 0;
                    if (slug.includes('getting-started') || slug.includes('getting_started')) return 1;
                    return 2;
                };
                return scoreSlug((a.attributes?.slug || '').toLowerCase()) -
                    scoreSlug((b.attributes?.slug || '').toLowerCase());
            });

        let providerBlock = '';
        let variablesBlock = '';
        let exampleUsage = '';

        // Collect content from all relevant docs
        const allContents = [];

        // 5a. Fetch overview doc content
        if (overviewDoc) {
            try {
                const contentData = await fetchWithProxy(`${REGISTRY_API}/v2/provider-docs/${overviewDoc.id}`);
                const content = contentData.data?.attributes?.content || '';
                if (content) allContents.push(content);
            } catch (e) {
                // Ignore doc fetching error
            }
        }

        // 5b. Fetch guide docs (authentication/configuration) — max 2 to limit API calls
        for (const guideDoc of guideDocs.slice(0, 2)) {
            try {
                const contentData = await fetchWithProxy(`${REGISTRY_API}/v2/provider-docs/${guideDoc.id}`);
                const content = contentData.data?.attributes?.content || '';
                if (content) allContents.push(content);
            } catch (e) {
                // Ignore doc fetching error
            }
        }

        // 6. Parse from all collected content (first successful result wins)
        for (const content of allContents) {
            if (!exampleUsage) {
                exampleUsage = extractExampleUsage(content);
            }
            if (!providerBlock) {
                providerBlock = extractProviderBlock(content, providerName);
            }
            if (!variablesBlock) {
                variablesBlock = extractVariables(content, providerName);
            }
            // Stop early if we have everything
            if (providerBlock && variablesBlock) break;
        }

        // 7. If we still don't have variables, do a combined pass across all docs
        if (!variablesBlock && allContents.length > 1) {
            const combinedMarkdown = allContents.join('\n\n---\n\n');
            variablesBlock = extractVariables(combinedMarkdown, providerName);
        }

        return {
            latestVersion,
            description: latestVersionData.attributes?.description || providerData.attributes?.description || '',
            providerBlock,
            variablesBlock,
            exampleUsage,
            resources: resourceDocs.slice(0, 5),
        };
    } catch (e) {
        console.warn('Registry API fetch failed:', e);
        return null;
    }
}

// ============================================================
// Code Block Extraction
// ============================================================

/** Extract all HCL/Terraform code blocks from markdown */
function extractAllCodeBlocks(markdown) {
    const blocks = [];
    const regex = /```(?:terraform|hcl|tf)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(markdown)) !== null) {
        blocks.push(match[1].trim());
    }
    return blocks;
}

function extractExampleUsage(markdown) {
    // Try "Example Usage" section first
    const match = markdown.match(/## Example Usage[\s\S]*?```(?:terraform|hcl|tf)\n([\s\S]*?)```/);
    if (match) return match[1].trim();

    // Fallback: first HCL code block in the document
    const blocks = extractAllCodeBlocks(markdown);
    return blocks[0] || '';
}

// ============================================================
// Provider Block Extraction (improved)
// ============================================================

function extractProviderBlock(markdown, providerName) {
    // Strategy 1: Search all code blocks for provider block
    const codeBlocks = extractAllCodeBlocks(markdown);
    for (const block of codeBlocks) {
        const result = findProviderBlockInCode(block, providerName);
        if (result) return result;
    }

    // Strategy 2: Search within specific documentation sections
    const sectionPatterns = [
        /## (?:Authentication|Provider Configuration|Provider Setup)[\s\S]*?```(?:terraform|hcl|tf)\n([\s\S]*?)```/gi,
        /## (?:Configuration|Setup|Getting Started)[\s\S]*?```(?:terraform|hcl|tf)\n([\s\S]*?)```/gi,
        /## (?:Example|Usage)[\s\S]*?```(?:terraform|hcl|tf)\n([\s\S]*?)```/gi,
    ];

    for (const pattern of sectionPatterns) {
        let match;
        while ((match = pattern.exec(markdown)) !== null) {
            const result = findProviderBlockInCode(match[1], providerName);
            if (result) return result;
        }
    }

    return '';
}

/**
 * Find a `provider "name" { ... }` block within code, with proper brace
 * matching so nested blocks (e.g. `features {}`) are included.
 */
function findProviderBlockInCode(code, providerName) {
    const escapedName = providerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const providerStart = new RegExp(`provider\\s+"${escapedName}"\\s*\\{`);
    const match = code.match(providerStart);
    if (!match) return '';

    const startIdx = match.index;
    const braceStart = code.indexOf('{', startIdx);
    if (braceStart === -1) return '';

    // Count braces to find the matching closing brace
    let depth = 0;
    let endIdx = -1;

    for (let i = braceStart; i < code.length; i++) {
        if (code[i] === '{') depth++;
        else if (code[i] === '}') {
            depth--;
            if (depth === 0) {
                endIdx = i;
                break;
            }
        }
    }

    if (endIdx === -1) return '';
    return code.substring(startIdx, endIdx + 1);
}

// ============================================================
// Variable Extraction (improved)
// ============================================================

function extractVariables(markdown, providerName) {
    // 1. Try to extract explicit `variable` blocks from any code block
    const codeBlocks = extractAllCodeBlocks(markdown);
    for (const block of codeBlocks) {
        const varRegex = /variable\s+"[^"]+"\s*\{[\s\S]*?\}/g;
        const matches = block.match(varRegex);
        if (matches && matches.length > 0) {
            return matches.join('\n\n');
        }
    }

    // 2. Infer variables from provider block arguments
    const providerBlock = extractProviderBlock(markdown, providerName);
    const inferredVars = inferVariablesFromProviderBlock(providerBlock, providerName);

    // 3. Parse from documentation argument reference sections
    const docVars = parseVariablesFromDocSections(markdown, providerName);

    // Merge: prefer inferred (from actual provider block) then fill with doc-parsed
    const seenNames = new Set();
    const merged = [];

    for (const v of inferredVars) {
        if (seenNames.has(v.name)) continue;
        seenNames.add(v.name);
        merged.push(v);
    }
    for (const v of docVars) {
        if (seenNames.has(v.name)) continue;
        seenNames.add(v.name);
        merged.push(v);
    }

    if (merged.length === 0) return '';

    return merged.slice(0, 8).map(v => formatVariableBlock(v, providerName)).join('\n\n');
}

/**
 * Infer variables from a provider block by finding `var.xxx` references.
 * For example: `token = var.my_token` → variable "my_token"
 */
function inferVariablesFromProviderBlock(providerBlock, providerName) {
    if (!providerBlock) return [];

    const variables = [];
    const varRefRegex = /(\w+)\s*=\s*var\.(\w+)/g;
    let match;

    while ((match = varRefRegex.exec(providerBlock)) !== null) {
        const attrName = match[1];  // e.g. "token", "region"
        const varName = match[2];   // e.g. "my_token", "region"

        const isSensitive = ['token', 'password', 'secret', 'key', 'credential', 'api_key']
            .some(kw => attrName.includes(kw) || varName.includes(kw));

        variables.push({
            name: varName,
            description: `${providerName} provider ${attrName}`,
            type: 'string',
            sensitive: isSensitive,
            required: true,
        });
    }

    return variables;
}

/**
 * Parse variable information from documentation sections
 * (Argument Reference, Schema, Authentication, Required/Optional subsections)
 */
function parseVariablesFromDocSections(markdown, providerName) {
    const variables = [];
    const seenNames = new Set();

    // Try multiple section patterns in priority order
    const sectionDefs = [
        { pattern: /### Required([\s\S]*?)(?=\n###\s|\n##\s|$)/gi, forceRequired: true },
        { pattern: /### Optional([\s\S]*?)(?=\n###\s|\n##\s|$)/gi, forceRequired: false },
        { pattern: /## Argument Reference([\s\S]*?)(?=\n##\s|$)/gi, forceRequired: false },
        { pattern: /## Schema([\s\S]*?)(?=\n##\s|$)/gi, forceRequired: false },
        { pattern: /## (?:Provider )?Configuration([\s\S]*?)(?=\n##\s|$)/gi, forceRequired: false },
        { pattern: /## Authentication([\s\S]*?)(?=\n##\s|$)/gi, forceRequired: false },
    ];

    for (const { pattern, forceRequired } of sectionDefs) {
        let sectionMatch;
        while ((sectionMatch = pattern.exec(markdown)) !== null) {
            parseArgumentsFromSection(sectionMatch[1], providerName, variables, seenNames, forceRequired);
            if (variables.length >= 8) break;
        }
        if (variables.length >= 8) break;
    }

    return variables;
}

/**
 * Parse variable definitions from a documentation section using multiple
 * markdown formats commonly used across different provider docs.
 */
function parseArgumentsFromSection(section, providerName, variables, seenNames, forceRequired) {
    // Pattern 1: `- \`name\` - (Required, type) description`
    // Pattern 2: `* **name** - (Required) description` or `* \`name\` (Required) description`
    // Pattern 3: `- \`name\` - description` (no parenthesized type info)
    const patterns = [
        { regex: /[*-]\s+`([a-zA-Z0-9_-]+)`\s+-\s+\(([^)]*)\)\s*(.*)/g, hasTypeInfo: true },
        { regex: /[*-]\s+(?:\*\*|`)([a-zA-Z0-9_-]+)(?:\*\*|`)\s*[-–—]?\s*\(([^)]*)\)\s*(.*)/g, hasTypeInfo: true },
        { regex: /[*-]\s+`([a-zA-Z0-9_-]+)`\s*[-–—]\s+(.*)/g, hasTypeInfo: false },
    ];

    for (const { regex, hasTypeInfo } of patterns) {
        let match;
        while ((match = regex.exec(section)) !== null && variables.length < 8) {
            const name = match[1];
            if (seenNames.has(name)) continue;

            // Skip obviously non-variable items
            if (['id', 'self', 'type', 'name'].includes(name)) continue;

            seenNames.add(name);

            let reqTag = '';
            let desc = '';
            if (hasTypeInfo) {
                reqTag = (match[2] || '').toLowerCase();
                desc = (match[3] || '').trim().replace(/"/g, '\\"').substring(0, 100);
            } else {
                desc = (match[2] || '').trim().replace(/"/g, '\\"').substring(0, 100);
            }

            const isRequired = forceRequired || reqTag.includes('required');

            const isSensitive = reqTag.includes('sensitive') ||
                name.includes('token') || name.includes('password') ||
                name.includes('secret') || name.includes('key') ||
                name.includes('credential');

            variables.push({
                name,
                description: desc || `${providerName} ${name}`,
                type: 'string',
                sensitive: isSensitive,
                required: isRequired,
            });
        }
    }
}

/**
 * Format a variable object into a Terraform variable block string.
 */
function formatVariableBlock(varDef, providerName) {
    // Add provider prefix if the name doesn't already have one
    const varName = varDef.name.startsWith(providerName)
        ? varDef.name
        : `${providerName}_${varDef.name}`;

    let block = `variable "${varName}" {\n`;
    block += `  description = "${varDef.description}"\n`;
    block += `  type        = ${varDef.type}\n`;

    if (varDef.sensitive) {
        block += `  sensitive   = true\n`;
    }
    if (!varDef.required) {
        block += `  default     = ""\n`;
    }
    block += `}`;

    return block;
}
