import {
  fetchAppleDocumentationSnippet,
  fetchAppleDocumentationStructuredContext,
} from "../../adapters/appleDocs/content.js";
import {
  DOC_FETCH_CACHE_MAX_ENTRIES,
  DOC_FETCH_CACHE_TTL_MS,
  DOC_FETCH_MAX_TOTAL_ATTEMPTS,
  DOC_FETCH_MIN_REMAINING_BUDGET_MS,
  DOC_FETCH_RETRIES,
  DOC_FETCH_TIMEOUT_MS,
  type DocsContextDetailLevel,
  type DocsContextItem,
} from "./types.js";
import { limitExcerpt } from "./utils.js";

type StructuredDocFetchValue = Awaited<ReturnType<typeof fetchAppleDocumentationStructuredContext>>;
type CompactDocFetchValue = Awaited<ReturnType<typeof fetchAppleDocumentationSnippet>>;
type StructuredDocFetchProjection = {
  excerpt?: string;
  details?: DocsContextItem["details"];
  hasSignals: boolean;
};
type DocFetchCacheEntry = {
  expiresAt: number;
  value: unknown;
};

type DocFetchContext = {
  detailLevel: DocsContextDetailLevel;
  url: string;
  deadline: number;
  excerptMaxChars: number;
};

export type DocFetchStats = {
  attempts: number;
  successes: number;
  cacheHits: number;
  cacheMisses: number;
};

export type HydrateDocsContextItemParams = {
  detailLevel: DocsContextDetailLevel;
  url: string;
  itemIndex: number;
  docFetchTopItemsPerQuery: number;
  deadline: number;
  excerptMaxChars: number;
  fallbackExcerpt: string;
  stats: DocFetchStats;
};

const docFetchCache = new Map<string, DocFetchCacheEntry>();

const makeDocFetchCacheKey = (detailLevel: DocsContextDetailLevel, url: string, excerptMaxChars: number): string =>
  `${detailLevel}|${excerptMaxChars}|${url}`;

const pruneDocFetchCache = (): void => {
  const now = Date.now();
  for (const [key, entry] of docFetchCache.entries()) {
    if (entry.expiresAt <= now) {
      docFetchCache.delete(key);
    }
  }

  while (docFetchCache.size > DOC_FETCH_CACHE_MAX_ENTRIES) {
    const oldestKey = docFetchCache.keys().next().value;
    if (!oldestKey) {
      break;
    }

    docFetchCache.delete(oldestKey);
  }
};

const readDocFetchCache = <T>(key: string): { hit: boolean; value?: T } => {
  const entry = docFetchCache.get(key);
  if (!entry) {
    return { hit: false };
  }
  if (entry.expiresAt <= Date.now()) {
    docFetchCache.delete(key);
    return { hit: false };
  }

  docFetchCache.delete(key);
  docFetchCache.set(key, entry);

  return {
    hit: true,
    value: entry.value as T,
  };
};

const writeDocFetchCache = (key: string, value: unknown): void => {
  docFetchCache.set(key, {
    value,
    expiresAt: Date.now() + DOC_FETCH_CACHE_TTL_MS,
  });
  pruneDocFetchCache();
};

const buildStructuredDetails = (
  structuredContext: StructuredDocFetchValue | null | undefined,
  excerptMaxChars: number,
): DocsContextItem["details"] | undefined => {
  const details: DocsContextItem["details"] = {};
  if (structuredContext?.summary) {
    details.summary = limitExcerpt(structuredContext.summary, excerptMaxChars);
  }
  if (structuredContext?.declaration) {
    details.declaration = limitExcerpt(structuredContext.declaration, excerptMaxChars);
  }
  if (structuredContext?.codeExample) {
    details.codeExample = structuredContext.codeExample;
  }
  if (structuredContext?.deprecation) {
    details.deprecation = limitExcerpt(structuredContext.deprecation, excerptMaxChars);
  }

  return Object.keys(details).length > 0 ? details : undefined;
};

const projectStructuredContext = (
  structuredContext: StructuredDocFetchValue | null | undefined,
  excerptMaxChars: number,
): StructuredDocFetchProjection => {
  const excerpt = structuredContext?.snippet ? limitExcerpt(structuredContext.snippet, excerptMaxChars) : undefined;
  const details = buildStructuredDetails(structuredContext, excerptMaxChars);

  return {
    hasSignals: Boolean(excerpt || details),
    ...(excerpt ? { excerpt } : {}),
    ...(details ? { details } : {}),
  };
};

const canFetchRemoteDoc = (stats: DocFetchStats, deadline: number): boolean =>
  stats.attempts < DOC_FETCH_MAX_TOTAL_ATTEMPTS && deadline - Date.now() > DOC_FETCH_MIN_REMAINING_BUDGET_MS;

const buildDocFetchTimeoutMs = (deadline: number): number =>
  Math.max(DOC_FETCH_MIN_REMAINING_BUDGET_MS, Math.min(DOC_FETCH_TIMEOUT_MS, deadline - Date.now()));

const fetchStructuredContextWithCache = async (
  context: DocFetchContext,
  stats: DocFetchStats,
): Promise<StructuredDocFetchValue | null | undefined> => {
  const cacheKey = makeDocFetchCacheKey(context.detailLevel, context.url, context.excerptMaxChars);
  const cached = readDocFetchCache<StructuredDocFetchValue | null>(cacheKey);
  if (cached.hit) {
    stats.cacheHits += 1;
    return cached.value ?? null;
  }

  stats.cacheMisses += 1;
  if (!canFetchRemoteDoc(stats, context.deadline)) {
    return undefined;
  }

  stats.attempts += 1;
  const timeoutMs = buildDocFetchTimeoutMs(context.deadline);

  try {
    const structuredContext = await fetchAppleDocumentationStructuredContext(context.url, {
      timeoutMs,
      retries: DOC_FETCH_RETRIES,
      maxChars: context.excerptMaxChars,
    });
    writeDocFetchCache(cacheKey, structuredContext ?? null);

    const projection = projectStructuredContext(structuredContext, context.excerptMaxChars);
    if (projection.hasSignals) {
      stats.successes += 1;
    }

    return structuredContext ?? null;
  } catch {
    return undefined;
  }
};

const fetchSnippetWithCache = async (
  context: DocFetchContext,
  stats: DocFetchStats,
): Promise<CompactDocFetchValue | null | undefined> => {
  const cacheKey = makeDocFetchCacheKey(context.detailLevel, context.url, context.excerptMaxChars);
  const cached = readDocFetchCache<CompactDocFetchValue | null>(cacheKey);
  if (cached.hit) {
    stats.cacheHits += 1;
    return cached.value ?? null;
  }

  stats.cacheMisses += 1;
  if (!canFetchRemoteDoc(stats, context.deadline)) {
    return undefined;
  }

  stats.attempts += 1;
  const timeoutMs = buildDocFetchTimeoutMs(context.deadline);

  try {
    const docSnippet = await fetchAppleDocumentationSnippet(context.url, {
      timeoutMs,
      retries: DOC_FETCH_RETRIES,
      maxChars: context.excerptMaxChars,
    });
    writeDocFetchCache(cacheKey, docSnippet ?? null);

    if (docSnippet && docSnippet.length > 0) {
      stats.successes += 1;
    }

    return docSnippet ?? null;
  } catch {
    return undefined;
  }
};

export const createDocFetchStats = (): DocFetchStats => ({
  attempts: 0,
  successes: 0,
  cacheHits: 0,
  cacheMisses: 0,
});

export const hydrateDocsContextItem = async ({
  detailLevel,
  url,
  itemIndex,
  docFetchTopItemsPerQuery,
  deadline,
  excerptMaxChars,
  fallbackExcerpt,
  stats,
}: HydrateDocsContextItemParams): Promise<Pick<DocsContextItem, "excerpt" | "details">> => {
  let excerpt = fallbackExcerpt;
  let details: DocsContextItem["details"];

  const shouldTryDocFetch = itemIndex < docFetchTopItemsPerQuery;
  if (!shouldTryDocFetch) {
    return { excerpt };
  }

  const context: DocFetchContext = {
    detailLevel,
    url,
    deadline,
    excerptMaxChars,
  };

  if (detailLevel === "structured") {
    const structuredContext = await fetchStructuredContextWithCache(context, stats);
    if (structuredContext !== undefined) {
      const projection = projectStructuredContext(structuredContext, excerptMaxChars);
      if (projection.excerpt) {
        excerpt = projection.excerpt;
      }
      details = projection.details;
    }

    return {
      excerpt,
      ...(details ? { details } : {}),
    };
  }

  const docSnippet = await fetchSnippetWithCache(context, stats);
  if (docSnippet && docSnippet.length > 0) {
    excerpt = limitExcerpt(docSnippet, excerptMaxChars);
  }

  return { excerpt };
};
