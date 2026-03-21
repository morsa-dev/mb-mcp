import { buildProviderGuides, DOCS_CONTEXT_EXAMPLE, PROVIDER_NOTES, RUN_COMMAND } from "./content.js";
import { PAGE_STYLES } from "./pageStyles.js";
import { renderInstructionsScript } from "./pageScript.js";
import { renderReconnectPanels, renderSetupModeSwitchers, renderSetupPanels } from "./renderSections.js";
import { escapeHtml, renderCodeBlock } from "./renderUtils.js";
import type { InstructionsPageModel } from "./types.js";

export type { InstructionsPageModel } from "./types.js";

export const renderInstructionsPage = (model: InstructionsPageModel): string => {
  const providers = buildProviderGuides(model.mcpUrl);
  const script = renderInstructionsScript(providers);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Memory Bank MCP Instructions</title>
    <meta name="description" content="Connection guide for the public Memory Bank MCP server on Morsa." />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <style>
${PAGE_STYLES}
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <div class="hero-inner">
          <div>
            <div class="eyebrow">Morsa • Memory Bank MCP</div>
            <h1>Connect Memory Bank MCP</h1>
            <p class="hero-copy">
              Choose your provider, complete setup, and run the command below in your coding agent.
            </p>
            <div class="tool-badges">
              <div class="tool-badge"><code>create</code> <span>Generate Memory Bank setup instructions</span></div>
              <div class="tool-badge"><code>docs_context</code> <span>Return supporting official documentation context</span></div>
            </div>
          </div>
        </div>
      </section>

      <div class="layout">
        <section class="step-card">
          <div class="step-heading">
            <div class="step-number">1</div>
            <div>
              <h2 class="step-title">Choose provider and setup mode</h2>
            </div>
          </div>

          <p class="section-label">Provider</p>
          <div class="provider-switcher" role="tablist" aria-label="MCP providers">
            ${providers
              .map((provider, index) => {
                const classes = ["provider-button"];
                if (index === 0) {
                  classes.push("is-active");
                }

                return `<button type="button" class="${classes.join(" ")}" data-provider-switch="${provider.id}">${escapeHtml(provider.label)}</button>`;
              })
              .join("")}
          </div>

          <p class="section-label" style="margin-top: 18px;">Setup mode</p>
          ${renderSetupModeSwitchers(providers)}

          ${Object.entries(PROVIDER_NOTES)
            .map(
              ([providerId, note]) => `
                <p class="provider-note" data-provider-note="${escapeHtml(providerId)}" hidden>
                  ${escapeHtml(note)}
                </p>
              `,
            )
            .join("")}
        </section>

        <section class="step-card">
          <div class="step-heading">
            <div class="step-number">2</div>
            <div>
              <h2 class="step-title">Install MCP connection</h2>
            </div>
          </div>

          ${renderSetupPanels(providers)}
        </section>

        <section class="step-card">
          <div class="step-heading">
            <div class="step-number">3</div>
            <div>
              <h2 class="step-title">Run command in your coding agent</h2>
            </div>
          </div>

          ${renderCodeBlock("agent-run-command", RUN_COMMAND)}

          <div class="secondary-example">
            <p class="secondary-example-title">Optional docs_context example for stack-specific official documentation.</p>
            ${renderCodeBlock("docs-context-example", DOCS_CONTEXT_EXAMPLE)}
          </div>
        </section>

        <section class="step-card">
          <div class="step-heading">
            <div class="step-number">4</div>
            <div>
              <h2 class="step-title">Reconnect if MCP is not detected</h2>
            </div>
          </div>

          ${renderReconnectPanels(providers)}
        </section>
      </div>

      <div class="footer">
        Hosted by Morsa. This page is served directly from the open-source MCP server so the setup contract stays aligned with the deployed endpoint.
        <div class="footer-links">
          <a href="https://github.com/morsa-dev/mb-mcp" target="_blank" rel="noreferrer noopener">GitHub</a>
          <a href="${escapeHtml(model.websiteUrl)}" target="_blank" rel="noreferrer noopener">morsa.io</a>
        </div>
      </div>
    </main>

    <script>
${script}
    </script>
  </body>
</html>`;
};
