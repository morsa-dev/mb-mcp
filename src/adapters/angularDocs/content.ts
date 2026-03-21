import { PROJECT_USER_AGENT } from "../../serverMetadata.js";
import { DocsContextConfigurationError } from "../../features/docsContext/errors.js";
import { resolveAngularDocsVersion } from "./search.js";

const ANGULAR_DOCS_BASE_URL = "https://angular.dev";
const DEFAULT_TIMEOUT_MS = 3_000;
const DEFAULT_RETRIES = 1;
const DEFAULT_MAX_CHARS = 320;

const CONTENT_REQUEST_HEADERS: Record<string, string> = {
  "User-Agent": PROJECT_USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: `${ANGULAR_DOCS_BASE_URL}/`,
};

export type AngularDocSnippetOptions = {
  version?: string;
  timeoutMs?: number;
  retries?: number;
  maxChars?: number;
};

export type AngularDocStructuredContext = {
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

const decodeHtmlEntities = (value: string): string => {
  const namedEntities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const normalized = entity.toLowerCase();
    if (normalized in namedEntities) {
      return namedEntities[normalized] ?? match;
    }

    if (normalized.startsWith("#x")) {
      const codePoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    if (normalized.startsWith("#")) {
      const codePoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return match;
  });
};

const stripTags = (value: string): string => value.replace(/<[^>]+>/g, " ");
const cleanText = (value: string): string => normalizeWhitespace(decodeHtmlEntities(stripTags(value)));
const normalizeCode = (value: string): string => decodeHtmlEntities(value).replace(/\r\n/g, "\n").trim();

const truncateText = (value: string, maxChars: number): string => {
  const normalized = normalizeWhitespace(value);
  if (!normalized || normalized.length <= maxChars) {
    return normalized;
  }

  const boundary = normalized.lastIndexOf(" ", maxChars - 1);
  const cutoff = boundary >= Math.floor(maxChars * 0.6) ? boundary : maxChars;
  return `${normalized.slice(0, cutoff).trim()}...`;
};

const truncateCode = (value: string, maxChars: number): string => {
  const normalized = normalizeCode(value);
  if (!normalized || normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, maxChars).trimEnd()}\n...`;
};

const buildAngularDocsBaseUrl = (version: string | undefined): string => {
  const resolvedVersion = resolveAngularDocsVersion(version);
  if (resolvedVersion === "latest") {
    return ANGULAR_DOCS_BASE_URL;
  }
  if (resolvedVersion === "next") {
    return "https://next.angular.dev";
  }

  return `https://v${resolvedVersion}.angular.dev`;
};

const normalizeOptions = (options: AngularDocSnippetOptions): NormalizedOptions => {
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

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const fetchHtml = async (url: string, timeoutMs: number, retries: number): Promise<string> => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: CONTENT_REQUEST_HEADERS,
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Angular docs request failed with status ${response.status}.`);
      }

      return await response.text();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      await delay(Math.min(200 * 2 ** attempt, 1_000));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("Failed to fetch Angular docs content.");
};

const getPageContentSlice = (html: string): string => {
  const h1Match = /<h1\b[^>]*>[\s\S]*?<\/h1>/i.exec(html);
  const startIndex = h1Match?.index ?? 0;
  return html.slice(startIndex);
};

const extractTitle = (html: string): string | null => {
  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) {
    return cleanText(h1Match[1]);
  }

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch?.[1] ? cleanText(titleMatch[1]) : null;
};

const extractParagraphs = (html: string, limit: number): string[] => {
  const scopedHtml = getPageContentSlice(html);
  const paragraphRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];

  let match: RegExpExecArray | null = paragraphRegex.exec(scopedHtml);
  while (match && paragraphs.length < limit) {
    const text = cleanText(match[1] ?? "");
    if (text.length >= 16) {
      paragraphs.push(text);
    }
    match = paragraphRegex.exec(scopedHtml);
  }

  return paragraphs;
};

const extractCodeBlocks = (html: string, limit: number): string[] => {
  const scopedHtml = getPageContentSlice(html);
  const codeRegex = /<pre\b[^>]*>[\s\S]*?<code\b[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi;
  const blocks: string[] = [];

  let match: RegExpExecArray | null = codeRegex.exec(scopedHtml);
  while (match && blocks.length < limit) {
    const code = normalizeCode(stripTags(match[1] ?? ""));
    if (code.length > 0) {
      blocks.push(code);
    }
    match = codeRegex.exec(scopedHtml);
  }

  return blocks;
};

const extractDeprecation = (html: string, maxChars: number): string | undefined => {
  const scopedText = cleanText(getPageContentSlice(html));
  const deprecatedIndex = scopedText.toLowerCase().indexOf("deprecated");
  if (deprecatedIndex < 0) {
    return undefined;
  }

  const snippetStart = Math.max(0, deprecatedIndex - 40);
  const snippetEnd = Math.min(scopedText.length, deprecatedIndex + maxChars);
  return truncateText(scopedText.slice(snippetStart, snippetEnd), maxChars);
};

const toAbsoluteUrl = (url: string, version: string | undefined): string => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const baseUrl = buildAngularDocsBaseUrl(version);
  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }

  return `${baseUrl}/${url}`;
};

const isApiUrl = (url: string): boolean => {
  try {
    return new URL(url).pathname.startsWith("/api/");
  } catch {
    return false;
  }
};

const fetchStructuredContext = async (
  docUrl: string,
  options: AngularDocSnippetOptions = {},
): Promise<AngularDocStructuredContext | null> => {
  const normalizedOptions = normalizeOptions(options);
  let html: string;
  try {
    html = await fetchHtml(
      toAbsoluteUrl(docUrl, options.version),
      normalizedOptions.timeoutMs,
      normalizedOptions.retries,
    );
  } catch (error) {
    const resolvedVersion = options.version ? resolveAngularDocsVersion(options.version) : "latest";
    if (resolvedVersion !== "latest") {
      throw new DocsContextConfigurationError(
        `Angular docs version "${resolvedVersion}" is not available from official Angular documentation.`,
        { cause: error },
      );
    }

    throw error;
  }

  const title = extractTitle(html);
  const paragraphs = extractParagraphs(html, 3);
  const codeBlocks = extractCodeBlocks(html, 2);
  const summary = paragraphs[0] ?? title ?? "";
  const deprecation = extractDeprecation(html, normalizedOptions.maxChars);
  const declaration = isApiUrl(docUrl) ? codeBlocks[0] : undefined;
  const codeExample = isApiUrl(docUrl) ? codeBlocks[1] : codeBlocks[0];

  const context: AngularDocStructuredContext = {};
  if (summary) {
    context.summary = truncateText(summary, normalizedOptions.maxChars);
    context.snippet = truncateText(summary, normalizedOptions.maxChars);
  }
  if (declaration) {
    context.declaration = truncateCode(declaration, Math.min(1_200, normalizedOptions.maxChars * 2));
  }
  if (codeExample) {
    context.codeExample = truncateCode(codeExample, Math.min(1_200, normalizedOptions.maxChars * 2));
  }
  if (deprecation) {
    context.deprecation = deprecation;
  }

  return Object.keys(context).length > 0 ? context : null;
};

export const fetchAngularDocumentationStructuredContext = async (
  docUrl: string,
  options: AngularDocSnippetOptions = {},
): Promise<AngularDocStructuredContext | null> => fetchStructuredContext(docUrl, options);

export const fetchAngularDocumentationSnippet = async (
  docUrl: string,
  options: AngularDocSnippetOptions = {},
): Promise<string | null> => {
  const context = await fetchStructuredContext(docUrl, options);
  return context?.snippet ?? null;
};
