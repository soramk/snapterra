const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const REGISTRY_API = 'https://registry.terraform.io';

async function fetchWithProxy(url) {
    const res = await globalThis.fetch(CORS_PROXY + encodeURIComponent(url));
    const data = await res.json();
    return JSON.parse(data.contents);
}

function extractExampleUsage(markdown) {
    const match = markdown.match(/## Example Usage[\s\S]*?```(?:terraform|hcl)\n([\s\S]*?)```/);
    return match ? match[1].trim() : '';
}

function extractProviderBlock(markdown, providerName) {
    const content = extractExampleUsage(markdown);
    if (!content) return '';
    const provRegex = new RegExp(`provider\\s+"${providerName}"\\s*\\{[\\s\\S]*?\\}`, 'g');
    const match = content.match(provRegex);
    return match ? match[0] : '';
}

function extractVariables(markdown, providerName) {
    const exampleContent = extractExampleUsage(markdown);
    if (exampleContent) {
        const varRegex = /variable\s+"[^"]+"\s*\{[\s\S]*?\}/g;
        const matches = exampleContent.match(varRegex);
        if (matches && matches.length > 0) {
            return matches.join('\n\n');
        }
    }
    let argsSection = '';
    const argMatch = markdown.match(/## Argument Reference([\s\S]*?)(?:##|$)/i);
    if (argMatch) {
        argsSection = argMatch[1];
    } else {
        const schemaMatch = markdown.match(/## Schema([\s\S]*?)(?:##|$)/i);
        if (schemaMatch) {
            argsSection = schemaMatch[1];
        }
    }
    if (!argsSection) return '';
    const itemRegex = /-\s+\`([a-zA-Z0-9_-]+)\`\s+-\s+\(([^)]*)\)(.*)/g;
    const variables = [];
    let match;
    let count = 0;
    while ((match = itemRegex.exec(argsSection)) !== null && count < 5) {
        const name = match[1];
        const reqTag = match[2].toLowerCase();
        const desc = match[3].trim().replace(/"/g, '\\"').substring(0, 100);
        const isRequired = reqTag.includes('required');
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
        count++;
    }
    return variables.join('\n\n');
}

async function fetchRegistryData(source) {
    const parts = source.split('/');
    if (parts.length !== 2) return null;
    const [namespace, providerName] = parts;

    try {
        const searchData = await fetchWithProxy(`${REGISTRY_API}/v2/providers?filter[namespace]=${encodeURIComponent(namespace)}&filter[name]=${encodeURIComponent(providerName)}`);
        const providerData = searchData.data?.[0];
        if (!providerData) return null;
        const providerId = providerData.id;

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

        let provData;
        try {
            provData = await fetchWithProxy(`${REGISTRY_API}/v2/providers/${providerId}?include=provider-versions`);
        } catch (e) {
            return { latestVersion, description: providerData.attributes?.description || '' };
        }

        const included = provData.included || [];
        const latestVersionData = latestVersion
            ? included.find(v => v.attributes?.version === latestVersion)
            : included.sort((a, b) => new Date(b.attributes?.['published-at'] || 0) - new Date(a.attributes?.['published-at'] || 0))[0];

        if (!latestVersionData) return { latestVersion, description: providerData.attributes?.description || '' };

        let docsData;
        try {
            docsData = await fetchWithProxy(`${REGISTRY_API}/v2/provider-versions/${latestVersionData.id}?include=provider-docs`);
        } catch (e) {
            return { latestVersion, description: providerData.attributes?.description || '' };
        }

        const docsIncluded = docsData.included || [];
        const overviewDoc = docsIncluded.find(d => d.attributes?.category === 'overview');
        const resourceDocs = docsIncluded.filter(d => d.attributes?.category === 'resources').map(d => d.attributes?.title || d.attributes?.slug);

        let providerBlock = '';
        let variablesBlock = '';
        let exampleUsage = '';

        if (overviewDoc) {
            try {
                const contentData = await fetchWithProxy(`${REGISTRY_API}/v2/provider-docs/${overviewDoc.id}`);
                const content = contentData.data?.attributes?.content || '';
                exampleUsage = extractExampleUsage(content);
                providerBlock = extractProviderBlock(content, providerName);
                variablesBlock = extractVariables(content, providerName);
            } catch (e) {
                console.error("Doc fetch error", e);
            }
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

fetchRegistryData('hetznercloud/hcloud').then(console.log);
