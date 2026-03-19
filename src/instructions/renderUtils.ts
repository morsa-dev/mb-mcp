export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const renderCodeBlock = (targetId: string, content: string): string => `
  <div class="code-shell">
    <button type="button" class="copy-button copy-button-inline" data-copy-target="${targetId}">Copy</button>
    <pre class="code-block" id="${targetId}">${escapeHtml(content)}</pre>
  </div>
`;

export const renderLabeledCodeBlock = (label: string, targetId: string, content: string): string => `
  <div class="labeled-code-block">
    <div class="snippet-label">${escapeHtml(label)}</div>
    ${renderCodeBlock(targetId, content)}
  </div>
`;
