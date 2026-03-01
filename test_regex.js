const markdown = `
## Example Usage
\`\`\`terraform
variable "hcloud_token" {
  sensitive = true
}
\`\`\`
`

function extractExampleUsage(markdown) {
    const match = markdown.match(/## Example Usage[\s\S]*?\`\`\`(?:terraform|hcl)\n([\s\S]*?)\`\`\`/);
    return match ? match[1].trim() : '';
}

function extractVariables(markdown, providerName) {
    const exampleContent = extractExampleUsage(markdown);
    console.log("exampleContent:", exampleContent);
    if (exampleContent) {
        const varRegex = /variable\s+"[^"]+"\s*\{[\s\S]*?\}/g;
        const matches = exampleContent.match(varRegex);
        if (matches && matches.length > 0) {
            return matches.join('\n\n');
        }
    }
    return '';
}

console.log(extractVariables(markdown, 'hcloud'));
