import type { ProviderGuide } from "./types.js";

export const renderInstructionsScript = (providers: ProviderGuide[]): string => {
  const defaultModes = Object.fromEntries(providers.map((provider) => [provider.id, provider.defaultMode]));

  return `
      (() => {
        const providerButtons = Array.from(document.querySelectorAll("[data-provider-switch]"));
        const modeSwitchers = Array.from(document.querySelectorAll("[data-mode-switcher]"));
        const modeButtons = Array.from(document.querySelectorAll("[data-provider][data-mode]"));
        const providerNotes = Array.from(document.querySelectorAll("[data-provider-note]"));
        const setupProviderSections = Array.from(document.querySelectorAll("[data-provider-section]"));
        const setupPanels = Array.from(document.querySelectorAll("[data-provider-panel][data-mode-panel]"));
        const reconnectProviders = Array.from(document.querySelectorAll("[data-reconnect-provider]"));
        const reconnectPanels = Array.from(document.querySelectorAll("[data-reconnect-panel][data-reconnect-mode]"));
        const copyButtons = Array.from(document.querySelectorAll("[data-copy-target]"));

        const defaultModes = ${JSON.stringify(defaultModes)};
        let activeProvider = "cursor";

        const syncProvider = () => {
          providerButtons.forEach((button) => {
            const isActive = button.dataset.providerSwitch === activeProvider;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-selected", String(isActive));
          });

          modeSwitchers.forEach((switcher) => {
            const isActive = switcher.dataset.modeSwitcher === activeProvider;
            switcher.hidden = !isActive;
            switcher.setAttribute("aria-hidden", String(!isActive));
          });

          providerNotes.forEach((note) => {
            note.hidden = note.dataset.providerNote !== activeProvider;
          });

          setupProviderSections.forEach((section) => {
            const isActive = section.dataset.providerSection === activeProvider;
            section.hidden = !isActive;
            section.setAttribute("aria-hidden", String(!isActive));
          });

          reconnectProviders.forEach((section) => {
            const isActive = section.dataset.reconnectProvider === activeProvider;
            section.hidden = !isActive;
            section.setAttribute("aria-hidden", String(!isActive));
          });

          syncMode(activeProvider, defaultModes[activeProvider] || "config");
        };

        const syncMode = (provider, mode) => {
          defaultModes[provider] = mode;

          modeButtons.forEach((button) => {
            if (button.dataset.provider !== provider) return;

            const isActive = button.dataset.mode === mode;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-selected", String(isActive));
          });

          setupPanels.forEach((panel) => {
            if (panel.dataset.providerPanel !== provider) return;

            const isActive = panel.dataset.modePanel === mode;
            panel.hidden = !isActive;
            panel.setAttribute("aria-hidden", String(!isActive));
          });

          reconnectPanels.forEach((panel) => {
            if (panel.dataset.reconnectPanel !== provider) return;

            const isActive = panel.dataset.reconnectMode === mode;
            panel.hidden = !isActive;
            panel.setAttribute("aria-hidden", String(!isActive));
          });
        };

        providerButtons.forEach((button) => {
          button.addEventListener("click", () => {
            activeProvider = button.dataset.providerSwitch || "cursor";
            syncProvider();
          });
        });

        modeButtons.forEach((button) => {
          button.addEventListener("click", () => {
            const provider = button.dataset.provider;
            const mode = button.dataset.mode;

            if (!provider || !mode) return;
            syncMode(provider, mode);
          });
        });

        const copyText = async (value) => {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(value);
            return true;
          }

          const textarea = document.createElement("textarea");
          textarea.value = value;
          textarea.setAttribute("readonly", "true");
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();

          const ok = document.execCommand("copy");
          textarea.remove();
          return ok;
        };

        copyButtons.forEach((button) => {
          button.addEventListener("click", async () => {
            const targetId = button.dataset.copyTarget;
            const target = targetId ? document.getElementById(targetId) : null;

            if (!target) return;

            const originalLabel = button.textContent || "Copy";

            try {
              const ok = await copyText(target.textContent || "");
              button.textContent = ok ? "Copied" : "Copy failed";
            } catch {
              button.textContent = "Copy failed";
            }

            window.setTimeout(() => {
              button.textContent = originalLabel;
            }, 1200);
          });
        });

        syncProvider();
      })();
  `;
};
