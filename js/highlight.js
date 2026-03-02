/* ==========================================================================
   Terraform Boilerplate Generator — Syntax Highlighting
   ========================================================================== */

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
