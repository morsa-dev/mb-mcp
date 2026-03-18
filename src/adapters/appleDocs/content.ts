import { PROJECT_USER_AGENT } from "../../serverMetadata.js";

const APPLE_DOCS_BASE_URL = "https://developer.apple.com";
const APPLE_DOCS_JSON_BASE_URL = "https://developer.apple.com/tutorials/data";

const DEFAULT_TIMEOUT_MS = 3_000;
const DEFAULT_RETRIES = 1;
const DEFAULT_MAX_CHARS = 320;

export type AppleDocSnippetOptions = {
  timeoutMs?: number;
  retries?: number;
  maxChars?: number;
};

export type AppleDocStructuredContext = {
  snippet?: string;
  summary?: string;
  declaration?: string;
  codeExample?: string;
  deprecation?: string;
};

type NormalizedOptions = {
  timeoutMs: number;
  retries: number;
  maxChars: number;
};

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const truncateText = (value: string, maxChars: number): string => {
  const normalized = normalizeWhitespace(value);
  if (!normalized || normalized.length <= maxChars) {
    return normalized;
  }

  const boundary = normalized.lastIndexOf(" ", maxChars - 1);
  const cutoff = boundary >= Math.floor(maxChars * 0.6) ? boundary : maxChars;
  return `${normalized.slice(0, cutoff).trim()}...`;
};

const normalizeCode = (value: string): string => value.replace(/\r\n/g, "\n").trim();

const truncateCode = (value: string, maxChars: number): string => {
  const normalized = normalizeCode(value);
  if (!normalized || normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, maxChars).trimEnd()}\n...`;
};

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const textFromTokenArray = (value: unknown): string =>
  toArray(value)
    .map((token) => {
      if (token && typeof token === "object" && typeof (token as Record<string, unknown>).text === "string") {
        return (token as Record<string, unknown>).text as string;
      }

      return "";
    })
    .join("");

const textFromIdentifier = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  const parts = normalized.split("/").filter(Boolean);
  const lastPart = parts.at(-1);
  return lastPart ?? normalized;
};

const textFromInlineNode = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (!value || typeof value !== "object") {
    return "";
  }

  const node = value as Record<string, unknown>;
  if (typeof node.text === "string") {
    return node.text;
  }
  if (typeof node.code === "string") {
    return node.code;
  }
  if (typeof node.identifier === "string") {
    return textFromIdentifier(node.identifier);
  }
  if (Array.isArray(node.tokens)) {
    return textFromTokenArray(node.tokens);
  }
  if (Array.isArray(node.inlineContent)) {
    return node.inlineContent.map(textFromInlineNode).join(" ");
  }

  return "";
};

const textFromInlineArray = (value: unknown): string =>
  toArray(value)
    .map(textFromInlineNode)
    .join(" ");

const textFromCodeNode = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    const lines = value
      .map(textFromCodeNode)
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);
    return lines.join("\n");
  }
  if (!value || typeof value !== "object") {
    return "";
  }

  const node = value as Record<string, unknown>;
  if (typeof node.code === "string") {
    return node.code;
  }
  if (Array.isArray(node.code)) {
    return textFromCodeNode(node.code);
  }
  if (Array.isArray(node.tokens)) {
    return textFromTokenArray(node.tokens);
  }
  if (Array.isArray(node.inlineContent)) {
    return node.inlineContent.map(textFromInlineNode).join("");
  }

  return "";
};

const extractCandidates = (payload: unknown): string[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const document = payload as Record<string, unknown>;
  const candidates: string[] = [];

  const abstractText = textFromInlineArray(document.abstract);
  if (abstractText) {
    candidates.push(abstractText);
  }

  const primarySections = toArray(document.primaryContentSections);
  for (const section of primarySections) {
    if (!section || typeof section !== "object") {
      continue;
    }

    const sectionRecord = section as Record<string, unknown>;
    const contentItems = toArray(sectionRecord.content);
    for (const item of contentItems) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const itemRecord = item as Record<string, unknown>;
      const itemType = typeof itemRecord.type === "string" ? itemRecord.type : "";
      if (itemType === "paragraph") {
        const paragraphText = textFromInlineArray(itemRecord.inlineContent);
        if (paragraphText) {
          candidates.push(paragraphText);
        }
      }
    }

    const declarations = toArray(sectionRecord.declarations);
    for (const declaration of declarations) {
      if (!declaration || typeof declaration !== "object") {
        continue;
      }

      const declarationText = textFromInlineNode(declaration);
      if (declarationText) {
        candidates.push(declarationText);
      }
    }
  }

  const topicSections = toArray(document.topicSections);
  for (const topicSection of topicSections) {
    if (!topicSection || typeof topicSection !== "object") {
      continue;
    }

    const title = (topicSection as Record<string, unknown>).title;
    if (typeof title === "string" && title.trim()) {
      candidates.push(title);
    }
  }

  return candidates
    .map((candidate) => normalizeWhitespace(candidate))
    .filter((candidate) => candidate.length > 0);
};

const pickBestCandidate = (candidates: string[]): string | null => {
  if (candidates.length === 0) {
    return null;
  }

  const preferred = candidates.find((candidate) => candidate.length >= 80);
  return preferred ?? candidates[0] ?? null;
};

const extractDeclaration = (document: Record<string, unknown>): string | null => {
  const primarySections = toArray(document.primaryContentSections);
  for (const section of primarySections) {
    if (!section || typeof section !== "object") {
      continue;
    }

    const declarations = toArray((section as Record<string, unknown>).declarations);
    for (const declaration of declarations) {
      const text = textFromInlineNode(declaration);
      if (text.trim()) {
        return text;
      }
    }
  }

  return null;
};

const extractCodeExample = (document: Record<string, unknown>): string | null => {
  const primarySections = toArray(document.primaryContentSections);
  for (const section of primarySections) {
    if (!section || typeof section !== "object") {
      continue;
    }

    const contentItems = toArray((section as Record<string, unknown>).content);
    for (const item of contentItems) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const itemRecord = item as Record<string, unknown>;
      const itemType = typeof itemRecord.type === "string" ? itemRecord.type : "";
      if (itemType !== "codeListing" && itemType !== "code") {
        continue;
      }

      const fromCode = textFromCodeNode(itemRecord.code);
      if (fromCode.trim()) {
        return fromCode;
      }

      const fromTokens = textFromCodeNode(itemRecord.tokens);
      if (fromTokens.trim()) {
        return fromTokens;
      }

      const fromInline = textFromCodeNode(itemRecord.inlineContent);
      if (fromInline.trim()) {
        return fromInline;
      }
    }
  }

  return null;
};

const extractDeprecation = (document: Record<string, unknown>): string | null => {
  const candidates = [
    textFromInlineArray(document.deprecationSummary),
    typeof document.deprecationSummary === "string" ? document.deprecationSummary : "",
    typeof document.deprecatedSummary === "string" ? document.deprecatedSummary : "",
    typeof document.deprecationMessage === "string" ? document.deprecationMessage : "",
  ];

  return (
    candidates.map((value) => normalizeWhitespace(value)).find((value) => value.length > 0) ?? null
  );
};

const extractStructuredContext = (payload: unknown, maxChars: number): AppleDocStructuredContext | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const document = payload as Record<string, unknown>;
  const snippet = pickBestCandidate(extractCandidates(payload));
  const summary = textFromInlineArray(document.abstract) || snippet || "";
  const declaration = extractDeclaration(document);
  const codeExample = extractCodeExample(document);
  const deprecation = extractDeprecation(document);

  const context: AppleDocStructuredContext = {};
  if (snippet) {
    context.snippet = truncateText(snippet, maxChars);
  }
  if (summary) {
    context.summary = truncateText(summary, maxChars);
  }
  if (declaration) {
    context.declaration = truncateText(declaration, maxChars);
  }
  if (codeExample) {
    context.codeExample = truncateCode(codeExample, Math.min(1_200, maxChars * 2));
  }
  if (deprecation) {
    context.deprecation = truncateText(deprecation, maxChars);
  }

  return Object.keys(context).length > 0 ? context : null;
};

const toJsonDocUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "developer.apple.com") {
      return null;
    }

    const pathname = parsed.pathname.replace(/\/+$/, "");
    if (pathname.startsWith("/documentation/")) {
      const suffix = pathname.replace("/documentation/", "");
      return suffix ? `${APPLE_DOCS_JSON_BASE_URL}/documentation/${suffix}.json` : null;
    }
    if (pathname.startsWith("/tutorials/")) {
      const suffix = pathname.replace("/tutorials/", "");
      return suffix ? `${APPLE_DOCS_JSON_BASE_URL}/${suffix}.json` : null;
    }

    return null;
  } catch {
    return null;
  }
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJsonDocument = async (jsonUrl: string, timeoutMs: number, retries: number): Promise<unknown> => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(jsonUrl, {
        method: "GET",
        headers: {
          Accept: "application/json,text/plain,*/*",
          Referer: APPLE_DOCS_BASE_URL,
          "User-Agent": PROJECT_USER_AGENT,
        },
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Doc JSON request failed with status ${response.status}.`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      await delay(Math.min(200 * 2 ** attempt, 1_000));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("Failed to fetch Apple documentation JSON.");
};

const normalizeOptions = (options: AppleDocSnippetOptions): NormalizedOptions => {
  const timeoutMs =
    typeof options.timeoutMs === "number" && Number.isFinite(options.timeoutMs)
      ? Math.min(10_000, Math.max(500, Math.floor(options.timeoutMs)))
      : DEFAULT_TIMEOUT_MS;
  const retries =
    typeof options.retries === "number" && Number.isFinite(options.retries)
      ? Math.min(3, Math.max(0, Math.floor(options.retries)))
      : DEFAULT_RETRIES;
  const maxChars =
    typeof options.maxChars === "number" && Number.isFinite(options.maxChars)
      ? Math.min(1_200, Math.max(80, Math.floor(options.maxChars)))
      : DEFAULT_MAX_CHARS;

  return {
    timeoutMs,
    retries,
    maxChars,
  };
};

const fetchStructuredContext = async (
  docUrl: string,
  options: AppleDocSnippetOptions = {},
): Promise<AppleDocStructuredContext | null> => {
  const jsonUrl = toJsonDocUrl(docUrl);
  if (!jsonUrl) {
    return null;
  }

  const normalizedOptions = normalizeOptions(options);
  const payload = await fetchJsonDocument(jsonUrl, normalizedOptions.timeoutMs, normalizedOptions.retries);
  return extractStructuredContext(payload, normalizedOptions.maxChars);
};

export const fetchAppleDocumentationStructuredContext = async (
  docUrl: string,
  options: AppleDocSnippetOptions = {},
): Promise<AppleDocStructuredContext | null> => fetchStructuredContext(docUrl, options);

export const fetchAppleDocumentationSnippet = async (
  docUrl: string,
  options: AppleDocSnippetOptions = {},
): Promise<string | null> => {
  const context = await fetchStructuredContext(docUrl, options);
  return context?.snippet ?? null;
};
