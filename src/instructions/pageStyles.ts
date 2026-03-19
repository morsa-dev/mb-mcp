export const PAGE_STYLES = `
      :root {
        color-scheme: dark;
        --page-background: #000000;
        --surface: rgba(16, 22, 42, 0.92);
        --surface-strong: rgba(18, 26, 48, 0.97);
        --surface-soft: rgba(22, 31, 58, 0.88);
        --surface-hover: rgba(28, 40, 74, 0.92);
        --border-soft: rgba(148, 163, 184, 0.16);
        --border-strong: rgba(96, 165, 250, 0.22);
        --text-primary: #f3f7ff;
        --text-muted: rgba(203, 213, 225, 0.8);
        --text-soft: rgba(148, 163, 184, 0.72);
        --accent: #2a9fff;
        --accent-strong: #a6deff;
        --shadow: 0 18px 44px rgba(2, 6, 23, 0.22);
        --shadow-soft: 0 10px 24px rgba(2, 6, 23, 0.18);
        --radius-xl: 28px;
        --radius-lg: 22px;
        --radius-md: 16px;
        --radius-sm: 12px;
        --code-font: "SFMono-Regular", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
        --body-font: "IBM Plex Sans", "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      [hidden] {
        display: none !important;
      }

      html {
        min-height: 100%;
        background: var(--page-background);
      }

      body {
        margin: 0;
        min-height: 100%;
        background: linear-gradient(180deg, #0f172a 0%, #0b1120 46%, #000000 100%);
        color: var(--text-primary);
        font-family: var(--body-font);
      }

      a {
        color: var(--accent);
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      code {
        font-family: var(--code-font);
      }

      .page {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0 44px;
      }

      .hero {
        position: relative;
        overflow: hidden;
        padding: 24px 28px;
        border: 1px solid var(--border-soft);
        border-radius: var(--radius-xl);
        background: linear-gradient(180deg, rgba(18, 26, 48, 0.97), rgba(13, 19, 36, 0.96));
        box-shadow: var(--shadow);
      }

      .hero::before,
      .hero::after {
        content: "";
        position: absolute;
        width: 180px;
        height: 180px;
        border-radius: 999px;
        filter: blur(54px);
        pointer-events: none;
        opacity: 0.3;
      }

      .hero::before {
        top: -80px;
        right: -40px;
        background: rgba(56, 189, 248, 0.08);
      }

      .hero::after {
        bottom: -90px;
        left: -60px;
        background: rgba(42, 159, 255, 0.06);
      }

      .hero-inner {
        position: relative;
        display: grid;
        gap: 18px;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: var(--accent-strong);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      .hero h1 {
        margin: 0;
        max-width: 760px;
        font-size: clamp(1.85rem, 4vw, 2.95rem);
        line-height: 1.04;
        letter-spacing: -0.04em;
      }

      .hero-copy {
        max-width: 800px;
        margin: 0;
        font-size: 0.98rem;
        line-height: 1.72;
        color: var(--text-muted);
      }

      .tool-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
        padding-top: 4px;
      }

      .tool-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 13px;
        border: 1px solid var(--border-strong);
        border-radius: 999px;
        background: rgba(21, 32, 60, 0.86);
        color: var(--accent-strong);
        font-size: 0.9rem;
        font-weight: 600;
      }

      .tool-badge span {
        color: var(--text-muted);
        font-weight: 500;
      }

      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 16px;
        margin-top: 18px;
      }

      .step-card {
        padding: 22px;
        border: 1px solid var(--border-soft);
        border-radius: var(--radius-lg);
        background: linear-gradient(180deg, rgba(16, 23, 43, 0.96), rgba(11, 17, 31, 0.98));
        box-shadow: var(--shadow-soft);
      }

      .step-heading {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        margin-bottom: 18px;
      }

      .step-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-size: 0.95rem;
        font-weight: 700;
        flex: 0 0 auto;
      }

      .step-title {
        display: flex;
        align-items: center;
        min-height: 36px;
        margin: 0;
        font-size: 1.16rem;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .step-description {
        margin: 6px 0 0;
        color: var(--text-muted);
        line-height: 1.65;
      }

      .section-label {
        margin: 0 0 12px;
        color: var(--text-soft);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .provider-switcher,
      .mode-switcher {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .provider-button,
      .mode-button,
      .copy-button,
      .action-button {
        border: 1px solid var(--border-soft);
        border-radius: var(--radius-sm);
        background: rgba(25, 35, 64, 0.96);
        color: var(--text-primary);
        cursor: pointer;
        transition:
          border-color 140ms ease,
          background-color 140ms ease,
          transform 140ms ease,
          box-shadow 140ms ease;
      }

      .provider-button,
      .mode-button {
        padding: 10px 15px;
        font: inherit;
        font-weight: 600;
      }

      .copy-button,
      .action-button {
        padding: 8px 12px;
        font: inherit;
        font-size: 0.84rem;
        font-weight: 700;
      }

      .action-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 49px;
        margin-top: 8px;
        margin-bottom: 14px;
        padding: 10px 15px;
        border-color: var(--accent);
        background: var(--accent);
        color: white;
      }

      .provider-button:hover,
      .mode-button:hover,
      .copy-button:hover,
      .action-button:hover {
        border-color: rgba(96, 165, 250, 0.34);
        background: rgba(31, 43, 78, 0.96);
        transform: translateY(-1px);
      }

      .action-button:hover {
        background: var(--accent);
        text-decoration: none;
      }

      .provider-button.is-active,
      .mode-button.is-active {
        border-color: var(--accent);
        background: var(--accent);
        color: white;
        box-shadow: 0 8px 18px rgba(64, 169, 255, 0.22);
      }

      .provider-note {
        margin: 12px 0 0;
        color: var(--text-muted);
        font-size: 0.92rem;
        line-height: 1.6;
      }

      .provider-panel {
        margin-top: 18px;
      }

      .provider-summary {
        margin-bottom: 18px;
      }

      .provider-summary h3 {
        margin: 0;
        font-size: 1.05rem;
      }

      .reconnect-description {
        margin: 8px 0 0;
        color: var(--text-muted);
        line-height: 1.65;
      }

      .mode-panel {
        margin-top: 16px;
      }

      .setup-copy {
        margin-bottom: 12px;
      }

      .setup-title {
        font-size: 1rem;
        font-weight: 700;
      }

      .setup-note {
        margin: 6px 0 0;
        color: var(--text-muted);
        line-height: 1.6;
      }

      .info-box {
        margin-bottom: 14px;
        padding: 14px 16px;
        border-radius: var(--radius-md);
        background: rgba(28, 39, 72, 0.72);
      }

      .info-box-label {
        color: var(--text-soft);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .info-box-value {
        margin-top: 8px;
        color: var(--text-primary);
      }

      .info-box-value code {
        display: inline-block;
        padding: 3px 6px;
        border-radius: 8px;
        background: rgba(2, 132, 199, 0.08);
      }

      .info-box-note,
      .hint-note {
        margin: 12px 0 0;
        color: var(--text-muted);
        line-height: 1.55;
      }

      .code-shell {
        position: relative;
        margin-top: 14px;
      }

      .snippet-label {
        margin-bottom: 8px;
        color: var(--text-soft);
        font-size: 0.84rem;
        font-weight: 700;
      }

      .labeled-code-block + .labeled-code-block {
        margin-top: 14px;
      }

      .labeled-code-block .code-shell {
        margin-top: 0;
      }

      .code-block {
        margin: 0;
        overflow-x: auto;
        padding: 18px 124px 18px 18px;
        border: 1px solid var(--border-soft);
        border-radius: var(--radius-md);
        background: linear-gradient(180deg, rgba(14, 20, 38, 0.98), rgba(10, 15, 28, 0.99));
        color: #ecf3ff;
        font-size: 0.92rem;
        line-height: 1.7;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .copy-button-inline {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 1;
        background: rgba(34, 46, 82, 0.96);
      }

      .step-list {
        margin: 16px 0 0;
        padding-left: 20px;
        color: var(--text-primary);
        line-height: 1.7;
      }

      .step-list li + li {
        margin-top: 8px;
      }

      .secondary-example {
        margin-top: 18px;
      }

      .secondary-example-title {
        margin: 0 0 10px;
        color: var(--text-soft);
        font-size: 0.84rem;
        font-weight: 700;
      }

      .footer {
        margin-top: 18px;
        padding: 0 4px;
        color: var(--text-soft);
        font-size: 0.95rem;
        line-height: 1.7;
      }

      .footer a {
        font-weight: 600;
      }

      .footer-links {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 8px;
      }

      @media (max-width: 860px) {
        .page {
          width: min(100% - 24px, 1120px);
          padding-top: 18px;
        }

        .hero {
          padding: 22px;
        }
      }

      @media (max-width: 640px) {
        .hero h1 {
          font-size: 2rem;
        }

        .step-card {
          padding: 20px;
        }

        .copy-button {
          width: 100%;
        }

        .copy-button-inline {
          position: static;
          width: auto;
          margin: 0 0 10px auto;
          display: block;
        }

        .code-block {
          padding-right: 18px;
        }
      }
`;
