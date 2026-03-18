import { PROJECT_USER_AGENT } from "../../serverMetadata.js";

const APPLE_DOCS_SEARCH_URL = "https://developer.apple.com/search/";
const APPLE_DOCS_BASE_URL = "https://developer.apple.com";

const DEFAULT_MAX_RESULTS = 6;
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_EXCERPT_MAX_CHARS = 260;
const MAX_LOOKAHEAD_CHARS = 2_500;

const SEARCH_REQUEST_HEADERS: Record<string, string> = {
  "User-Agent": PROJECT_USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: `${APPLE_DOCS_BASE_URL}/`,
};

const FILTER_TYPE_MAPPING = {
  all: new Set(["documentation", "documentation-article", "documentation-tutorial", "sample-code"]),
  documentation: new Set(["documentation", "documentation-article", "documentation-tutorial"]),
  sample: new Set(["sample-code"]),
} as const;

type SearchFilterType = keyof typeof FILTER_TYPE_MAPPING;

export type AppleDocsSearchOptions = {
  type?: SearchFilterType;
  maxResults?: number;
  excerptMaxChars?: number;
  timeoutMs?: number;
  retries?: number;
};

export type AppleDocsSearchResult = {
  title: string;
  url: string;
  excerpt: string;
  score: number;
  type: string;
};

type ExtractedSearchEntry = {
  title: string;
  url: string;
  excerpt: string;
  score: number;
  type: string;
};

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

const stripTags = (value: string): string => value.replace(/<[^>]+>/g, "");
const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();
const cleanText = (value: string): string => normalizeWhitespace(decodeHtmlEntities(stripTags(value)));

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

const normalizeFilterType = (value: unknown): SearchFilterType => {
  if (typeof value !== "string") {
    return "all";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "documentation" || normalized === "sample" || normalized === "all") {
    return normalized;
  }

  return "all";
};

const normalizeResultType = (value: string): string => value.trim().toLowerCase().replace(/_/g, "-");

const toAbsoluteUrl = (href: string): string => {
  if (!href) {
    return "";
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  if (href.startsWith("/")) {
    return `${APPLE_DOCS_BASE_URL}${href}`;
  }

  return `${APPLE_DOCS_BASE_URL}/${href}`;
};

const isSupportedUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "developer.apple.com") {
      return false;
    }

    const pathname = parsed.pathname.toLowerCase();
    const isDocumentationPath = pathname.includes("/documentation/");
    const isTutorialPath = pathname.startsWith("/tutorials/");
    if (!isDocumentationPath && !isTutorialPath) {
      return false;
    }

    if (pathname.includes("/design/human-interface-guidelines/")) {
      return false;
    }

    if (pathname.endsWith(".zip")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
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

const calculateScore = (positionIndex: number): number => {
  const rawScore = 1 / (1 + positionIndex * 0.25);
  return Number(rawScore.toFixed(3));
};

const extractSearchEntries = (
  html: string,
  filterType: SearchFilterType,
  maxResults: number,
  excerptMaxChars: number,
): ExtractedSearchEntry[] => {
  const allowedTypes = FILTER_TYPE_MAPPING[filterType];
  const seenUrls = new Set<string>();
  const entries: ExtractedSearchEntry[] = [];
  const anchorRegex = /<a\b([^>]*\bdata-result-type="[^"]+"[^>]*)>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null = anchorRegex.exec(html);
  while (match) {
    const attributes = match[1] ?? "";
    const titleHtml = match[2] ?? "";
    const typeMatch = attributes.match(/\bdata-result-type="([^"]+)"/i);
    const hrefMatch = attributes.match(/\bhref="([^"]+)"/i);
    const orderMatch = attributes.match(/\bdata-result-order="([^"]+)"/i);

    const rawType = typeMatch?.[1] ?? "";
    const normalizedType = normalizeResultType(rawType);
    const url = toAbsoluteUrl(hrefMatch?.[1] ?? "");
    const title = cleanText(titleHtml);

    if (!allowedTypes.has(normalizedType)) {
      match = anchorRegex.exec(html);
      continue;
    }

    if (!title || !url || !isSupportedUrl(url) || seenUrls.has(url)) {
      match = anchorRegex.exec(html);
      continue;
    }

    const lookahead = html.slice(anchorRegex.lastIndex, anchorRegex.lastIndex + MAX_LOOKAHEAD_CHARS);
    const articleEndIndex = lookahead.search(/<\/article>/i);
    const scopedSegment = articleEndIndex >= 0 ? lookahead.slice(0, articleEndIndex) : lookahead;
    const descriptionMatch = scopedSegment.match(/<p class="result-description[^"]*">([\s\S]*?)<\/p>/i);
    const excerpt = truncateExcerpt(cleanText(descriptionMatch?.[1] ?? ""), excerptMaxChars);

    const parsedOrder = Number.parseInt(orderMatch?.[1] ?? "", 10);
    const positionIndex = Number.isFinite(parsedOrder) && parsedOrder > 0 ? parsedOrder - 1 : entries.length;

    entries.push({
      title,
      url,
      excerpt,
      score: calculateScore(positionIndex),
      type: normalizedType,
    });

    seenUrls.add(url);
    if (entries.length >= maxResults) {
      break;
    }

    match = anchorRegex.exec(html);
  }

  return entries;
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const fetchAppleSearchHtml = async (query: string, timeoutMs: number, retries: number): Promise<string> => {
  const searchUrl = `${APPLE_DOCS_SEARCH_URL}?q=${encodeURIComponent(query)}`;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(searchUrl, {
        method: "GET",
        headers: SEARCH_REQUEST_HEADERS,
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Apple search request failed with status ${response.status}.`);
      }

      return await response.text();
    } catch (error) {
      if (attempt === retries) {
        const message = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to fetch Apple docs search results: ${message}`, {
          cause: error,
        });
      }

      await delay(Math.min(250 * 2 ** attempt, 1_500));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("Failed to fetch Apple docs search results.");
};

export const searchAppleDeveloperDocs = async (
  query: string,
  options: AppleDocsSearchOptions = {},
): Promise<AppleDocsSearchResult[]> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const filterType = normalizeFilterType(options.type);
  const maxResults = clampInteger(options.maxResults, 1, 20, DEFAULT_MAX_RESULTS);
  const excerptMaxChars = clampInteger(options.excerptMaxChars, 80, 600, DEFAULT_EXCERPT_MAX_CHARS);
  const timeoutMs = clampInteger(options.timeoutMs, 1, 30_000, DEFAULT_TIMEOUT_MS);
  const retries = clampInteger(options.retries, 0, 5, DEFAULT_RETRIES);

  const html = await fetchAppleSearchHtml(normalizedQuery, timeoutMs, retries);
  return extractSearchEntries(html, filterType, maxResults, excerptMaxChars);
};
