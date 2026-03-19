import { escapeHtml, renderCodeBlock, renderLabeledCodeBlock } from "./renderUtils.js";
import type { ProviderGuide } from "./types.js";

export const renderSetupModeSwitchers = (providers: ProviderGuide[]): string =>
  providers
    .map((provider, index) => {
      const hiddenAttribute = index === 0 ? "" : ' hidden aria-hidden="true"';

      return `
        <div class="mode-switcher" data-mode-switcher="${provider.id}"${hiddenAttribute}>
          ${provider.modes
            .map((mode) => {
              const classes = ["mode-button"];
              if (mode.id === provider.defaultMode) {
                classes.push("is-active");
              }

              return `<button type="button" class="${classes.join(" ")}" data-provider="${provider.id}" data-mode="${mode.id}">${escapeHtml(mode.label)}</button>`;
            })
            .join("")}
        </div>
      `;
    })
    .join("");

export const renderSetupPanels = (providers: ProviderGuide[]): string =>
  providers
    .map((provider, providerIndex) => {
      const providerHidden = providerIndex === 0 ? "" : ' hidden aria-hidden="true"';

      return `
        <section class="provider-panel" data-provider-section="${provider.id}"${providerHidden}>
          ${provider.modes
            .map((mode) => {
              const hiddenAttribute = mode.id === provider.defaultMode ? "" : ' hidden aria-hidden="true"';
              const pathBlock = mode.path
                ? `
                    <div class="info-box">
                      <div class="info-box-label">Config file path</div>
                      <div class="info-box-value"><code>${escapeHtml(mode.path)}</code></div>
                      ${mode.hint ? `<p class="info-box-note">${escapeHtml(mode.hint)}</p>` : ""}
                    </div>
                  `
                : mode.hint
                  ? `<p class="hint-note">${escapeHtml(mode.hint)}</p>`
                  : "";
              const actionButton =
                mode.actionHref && mode.actionLabel
                  ? `<a class="action-button" href="${escapeHtml(mode.actionHref)}" rel="noreferrer">${escapeHtml(mode.actionLabel)}</a>`
                  : "";
              const snippetBlock = mode.hideSnippet || !mode.snippet ? "" : renderCodeBlock(`${provider.id}-${mode.id}-snippet`, mode.snippet);

              return `
                <div class="mode-panel" data-provider-panel="${provider.id}" data-mode-panel="${mode.id}"${hiddenAttribute}>
                  ${
                    mode.title || mode.note
                      ? `
                        <div class="setup-copy">
                          ${mode.title ? `<div class="setup-title">${escapeHtml(mode.title)}</div>` : ""}
                          ${mode.note ? `<p class="setup-note">${escapeHtml(mode.note)}</p>` : ""}
                        </div>
                      `
                      : ""
                  }
                  ${pathBlock}
                  ${actionButton}
                  ${snippetBlock}
                </div>
              `;
            })
            .join("")}
        </section>
      `;
    })
    .join("");

export const renderReconnectPanels = (providers: ProviderGuide[]): string =>
  providers
    .map((provider, providerIndex) => {
      const providerHidden = providerIndex === 0 ? "" : ' hidden aria-hidden="true"';

      return `
        <section class="provider-panel" data-reconnect-provider="${provider.id}"${providerHidden}>
          ${provider.modes
            .map((mode) => {
              const reconnectGuide = provider.reconnect[mode.id];

              if (!reconnectGuide) {
                return "";
              }

              const hiddenAttribute = mode.id === provider.defaultMode ? "" : ' hidden aria-hidden="true"';
              const removeSnippet = reconnectGuide.removeSnippetTitle && reconnectGuide.removeSnippet
                ? renderLabeledCodeBlock(
                    reconnectGuide.removeSnippetTitle,
                    `${provider.id}-${mode.id}-reconnect-remove`,
                    reconnectGuide.removeSnippet,
                  )
                : "";
              const snippet = reconnectGuide.snippetTitle && reconnectGuide.snippet
                ? renderLabeledCodeBlock(
                    reconnectGuide.snippetTitle,
                    `${provider.id}-${mode.id}-reconnect-main`,
                    reconnectGuide.snippet,
                  )
                : "";
              const actionButton =
                reconnectGuide.actionHref && reconnectGuide.actionLabel
                  ? `<a class="action-button" href="${escapeHtml(reconnectGuide.actionHref)}" rel="noreferrer">${escapeHtml(reconnectGuide.actionLabel)}</a>`
                  : "";

              return `
                <div class="mode-panel" data-reconnect-panel="${provider.id}" data-reconnect-mode="${mode.id}"${hiddenAttribute}>
                  <p class="reconnect-description">${escapeHtml(reconnectGuide.description)}</p>
                  <ol class="step-list">
                    ${reconnectGuide.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
                  </ol>
                  ${actionButton}
                  ${removeSnippet}
                  ${snippet}
                </div>
              `;
            })
            .join("")}
        </section>
      `;
    })
    .join("");
