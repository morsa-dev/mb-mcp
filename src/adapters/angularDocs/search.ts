import { PROJECT_USER_AGENT } from "../../serverMetadata.js";
import { DocsContextConfigurationError } from "../../features/docsContext/errors.js";

const ANGULAR_DOCS_BASE_URL = "https://angular.dev";

const DEFAULT_MAX_RESULTS = 6;
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 1;
const DEFAULT_EXCERPT_MAX_CHARS = 260;

const SEARCH_REQUEST_HEADERS: Record<string, string> = {
  "User-Agent": PROJECT_USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: `${ANGULAR_DOCS_BASE_URL}/`,
};

const INDEX_PATHS = ["/api", "/overview"] as const;
const MIN_TOKEN_LENGTH = 2;
const ANGULAR_VERSION_PATTERN = /^v?(\d{1,3})(?:\.\d+){0,2}(?:[-+][\w.-]+)?$/i;

export type AngularDocsSearchOptions = {
  version?: string;
  maxResults?: number;
  excerptMaxChars?: number;
  timeoutMs?: number;
  retries?: number;
};

export type AngularDocsSearchResult = {
  title: string;
  url: string;
  excerpt: string;
  score: number;
  type: "api" | "guide";
};

type IndexEntry = {
  title: string;
  url: string;
  excerpt: string;
  type: "api" | "guide";
};

const MAX_INDEX_TITLE_CHARS = 120;

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

const extractAttributeValue = (attributes: string, attributeName: string): string | null => {
  const escapedAttributeName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = attributes.match(new RegExp(`\\b${escapedAttributeName}="([^"]+)"`, "i"));
  return match?.[1] ? decodeHtmlEntities(match[1]).trim() : null;
};

const normalizeIndexTitle = (value: string): string => {
  const normalized = cleanText(value);
  if (!normalized) {
    return "";
  }

  const headingMatch = normalized.match(/(?:^| )Explore (.+)$/i);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }

  if (normalized.length <= MAX_INDEX_TITLE_CHARS) {
    return normalized;
  }

  const sentenceCutoff = normalized.search(/[.!?](?:\s|$)/);
  if (sentenceCutoff > 0) {
    return normalized.slice(0, sentenceCutoff).trim();
  }

  const boundary = normalized.lastIndexOf(" ", MAX_INDEX_TITLE_CHARS);
  if (boundary >= Math.floor(MAX_INDEX_TITLE_CHARS * 0.6)) {
    return normalized.slice(0, boundary).trim();
  }

  return normalized.slice(0, MAX_INDEX_TITLE_CHARS).trim();
};

const extractAnchorHeading = (html: string): string => {
  const headingMatch = html.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
  return headingMatch?.[1] ? cleanText(headingMatch[1]) : "";
};

const extractAnchorTitle = (attributes: string, innerHtml: string): string => {
  const titleCandidates = [
    extractAttributeValue(attributes, "aria-label"),
    extractAttributeValue(attributes, "title"),
    extractAnchorHeading(innerHtml),
    cleanText(innerHtml),
  ];

  for (const candidate of titleCandidates) {
    if (!candidate) {
      continue;
    }

    const normalized = normalizeIndexTitle(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const truncateExcerpt = (excerpt: string, maxChars: number): string => {
  const cleaned = normalizeWhitespace(excerpt);
  if (!cleaned || cleaned.length <= maxChars) {
    return cleaned;
  }

  const boundary = cleaned.lastIndexOf(" ", maxChars - 1);
  const cutoff = boundary >= Math.floor(maxChars * 0.6) ? boundary : maxChars;
  return `${cleaned.slice(0, cutoff).trim()}...`;
};

const clampInteger = (value: unknown, min: number, max: number, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.floor(value);
  if (rounded < min) {
    return min;
  }
  if (rounded > max) {
    return max;
  }

  return rounded;
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeAngularVersion = (version: string | undefined): string | undefined => {
  if (typeof version !== "string") {
    return undefined;
  }

  const normalized = version.trim();
  if (!normalized) {
    return undefined;
  }

  if (/^(latest|current)$/i.test(normalized)) {
    return "latest";
  }
  if (/^next$/i.test(normalized)) {
    return "next";
  }

  const majorMatch = normalized.match(ANGULAR_VERSION_PATTERN);
  return majorMatch?.[1] ?? undefined;
};

export const resolveAngularDocsVersion = (version: string | undefined): string => {
  if (version === undefined) {
    return "latest";
  }

  const normalized = normalizeAngularVersion(version);
  if (!normalized) {
    throw new DocsContextConfigurationError(
      `Invalid Angular docs version "${version}". Use "latest", "next", or an Angular version like "20" or "20.2.1".`,
    );
  }

  return normalized;
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

const toAbsoluteUrl = (baseUrl: string, href: string): string => {
  if (!href) {
    return "";
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  if (href.startsWith("/")) {
    return `${baseUrl}${href}`;
  }

  return `${baseUrl}/${href}`;
};

const isAngularDocsUrl = (url: string, baseUrl: string): boolean => {
  try {
    const parsed = new URL(url);
    const expectedHost = new URL(baseUrl).hostname;
    if (parsed.hostname !== expectedHost) {
      return false;
    }

    if (parsed.pathname === "/" || parsed.pathname.startsWith("/playground")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const inferEntryType = (url: string): "api" | "guide" => {
  try {
    const pathname = new URL(url).pathname;
    return pathname.startsWith("/api") ? "api" : "guide";
  } catch {
    return "guide";
  }
};

const buildEntryExcerpt = (title: string, url: string): string => {
  if (url.includes("/api/")) {
    return `Angular API reference for ${title}.`;
  }

  return `Angular guide or reference page for ${title}.`;
};

const extractIndexEntries = (html: string, baseUrl: string, excerptMaxChars: number): IndexEntry[] => {
  const anchorRegex = /<a\b([^>]*)href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const seenUrls = new Set<string>();
  const entries: IndexEntry[] = [];

  let match: RegExpExecArray | null = anchorRegex.exec(html);
  while (match) {
    const attributes = match[1] ?? "";
    const rawHref = match[2] ?? "";
    const title = extractAnchorTitle(attributes, match[3] ?? "");
    const url = toAbsoluteUrl(baseUrl, rawHref);

    if (!title || !url || seenUrls.has(url) || !isAngularDocsUrl(url, baseUrl)) {
      match = anchorRegex.exec(html);
      continue;
    }

    entries.push({
      title,
      url,
      excerpt: truncateExcerpt(buildEntryExcerpt(title, url), excerptMaxChars),
      type: inferEntryType(url),
    });
    seenUrls.add(url);
    match = anchorRegex.exec(html);
  }

  return entries;
};

const tokenize = (value: string): string[] =>
  normalizeWhitespace(value)
    .toLowerCase()
    .split(/[^a-z0-9@._/-]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

const calculateScore = (entry: IndexEntry, query: string): number => {
  const normalizedQuery = normalizeWhitespace(query).toLowerCase();
  const title = entry.title.toLowerCase();
  const url = entry.url.toLowerCase();
  const tokens = tokenize(normalizedQuery);

  let score = 0;
  if (title === normalizedQuery) {
    score += 1.2;
  } else if (title.startsWith(normalizedQuery)) {
    score += 1.05;
  } else if (title.includes(normalizedQuery)) {
    score += 0.92;
  }

  if (url.includes(normalizedQuery)) {
    score += 0.7;
  }

  const matchedTokens = tokens.filter((token) => title.includes(token) || url.includes(token)).length;
  if (matchedTokens > 0) {
    score += matchedTokens / Math.max(tokens.length, 1);
  }

  if (entry.type === "api" && /(^|[^a-z])[@A-Z]/.test(query)) {
    score += 0.08;
  }

  return Number(score.toFixed(3));
};

const fetchHtml = async (url: string, timeoutMs: number, retries: number): Promise<string> => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: SEARCH_REQUEST_HEADERS,
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Angular docs request failed with status ${response.status}.`);
      }

      return await response.text();
    } catch (error) {
      if (attempt === retries) {
        const message = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to fetch Angular docs content: ${message}`, {
          cause: error,
        });
      }

      await delay(Math.min(200 * 2 ** attempt, 1_000));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("Failed to fetch Angular docs content.");
};

export const searchAngularDocs = async (
  query: string,
  options: AngularDocsSearchOptions = {},
): Promise<AngularDocsSearchResult[]> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const maxResults = clampInteger(options.maxResults, 1, 20, DEFAULT_MAX_RESULTS);
  const excerptMaxChars = clampInteger(options.excerptMaxChars, 80, 600, DEFAULT_EXCERPT_MAX_CHARS);
  const timeoutMs = clampInteger(options.timeoutMs, 1, 30_000, DEFAULT_TIMEOUT_MS);
  const retries = clampInteger(options.retries, 0, 5, DEFAULT_RETRIES);
  const resolvedVersion = resolveAngularDocsVersion(options.version);
  const baseUrl = buildAngularDocsBaseUrl(resolvedVersion);

  let indexHtmlPages: string[];
  try {
    indexHtmlPages = await Promise.all(INDEX_PATHS.map((path) => fetchHtml(`${baseUrl}${path}`, timeoutMs, retries)));
  } catch (error) {
    if (resolvedVersion !== "latest") {
      throw new DocsContextConfigurationError(
        `Angular docs version "${resolvedVersion}" is not available from official Angular documentation.`,
        { cause: error },
      );
    }

    throw error;
  }

  const allEntries = indexHtmlPages.flatMap((html) => extractIndexEntries(html, baseUrl, excerptMaxChars));
  const dedupedEntries = [...new Map(allEntries.map((entry) => [entry.url, entry])).values()];

  return dedupedEntries
    .map((entry) => ({
      ...entry,
      score: calculateScore(entry, normalizedQuery),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, maxResults);
};
