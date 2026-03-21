import { createDocFetchStats, hydrateDocsContextItem } from "./docFetch.js";
import { isDocsContextConfigurationError } from "./errors.js";
import { getDocsContextProvider } from "./providerRegistry.js";
import {
  DEFAULT_DETAIL_LEVEL,
  DEFAULT_EXCERPT_MAX_CHARS,
  DEFAULT_MAX_ITEMS_PER_QUERY,
  DEFAULT_NOTICE,
  DEFAULT_STACK,
  DOC_FETCH_TOP_ITEMS_PER_QUERY,
  DOCS_CONTEXT_SOURCE,
  MAX_QUERIES_PER_CALL,
  MAX_PER_QUERY_TIMEOUT_MS,
  MAX_TOTAL_LOOKUP_BUDGET_MS,
  PER_QUERY_RETRIES,
  type DocsContextDetailLevel,
  type DocsContextPayload,
  type DocsContextStack,
} from "./types.js";
import { limitExcerpt, toQueryResult } from "./utils.js";

export type BuildDocsContextArgs = {
  stack?: DocsContextStack | undefined;
  version?: string | undefined;
  detailLevel?: DocsContextDetailLevel | undefined;
  structuredTopItemsPerQuery?: number | undefined;
  queries: string[];
  maxItemsPerQuery?: number | undefined;
  excerptMaxChars?: number | undefined;
};

const buildNotice = (hadQueryFailures: boolean): string =>
  hadQueryFailures
    ? `${DEFAULT_NOTICE} Some queries returned no results or could not be fetched within the request budget.`
    : DEFAULT_NOTICE;

export const buildDocsContextPayload = async ({
  stack = DEFAULT_STACK,
  version,
  detailLevel = DEFAULT_DETAIL_LEVEL,
  structuredTopItemsPerQuery,
  queries,
  maxItemsPerQuery = DEFAULT_MAX_ITEMS_PER_QUERY,
  excerptMaxChars = DEFAULT_EXCERPT_MAX_CHARS,
}: BuildDocsContextArgs): Promise<DocsContextPayload> => {
  if (queries.length === 0) {
    throw new Error("docs_context requires a non-empty queries array.");
  }
  if (queries.length > MAX_QUERIES_PER_CALL) {
    throw new Error(`docs_context supports at most ${MAX_QUERIES_PER_CALL} queries per call.`);
  }

  const effectiveStructuredTopItemsPerQuery = Math.min(
    maxItemsPerQuery,
    structuredTopItemsPerQuery ?? DOC_FETCH_TOP_ITEMS_PER_QUERY,
  );
  const provider = getDocsContextProvider(stack);
  const resolvedVersion = provider.resolveVersion(version);
  const deadline = Date.now() + MAX_TOTAL_LOOKUP_BUDGET_MS;
  const results: DocsContextPayload["results"] = [];
  const docFetchStats = createDocFetchStats();
  let hadQueryFailures = false;

  for (const [index, query] of queries.entries()) {
    const remainingBudgetMs = deadline - Date.now();
    if (remainingBudgetMs <= 0) {
      hadQueryFailures = true;

      for (const skippedQuery of queries.slice(index)) {
        results.push(toQueryResult(skippedQuery, []));
      }

      break;
    }

    const timeoutMs = Math.min(MAX_PER_QUERY_TIMEOUT_MS, remainingBudgetMs);

    try {
      const searchItems = await provider.search(query, {
        ...(resolvedVersion ? { version: resolvedVersion } : {}),
        maxResults: maxItemsPerQuery,
        excerptMaxChars,
        timeoutMs,
        retries: PER_QUERY_RETRIES,
      });
      const contextItems: DocsContextPayload["results"][number]["items"] = [];
      const topItems = searchItems.slice(0, maxItemsPerQuery);
      if (topItems.length === 0) {
        hadQueryFailures = true;
      }
      const docFetchTopItemsPerQuery =
        detailLevel === "structured" ? effectiveStructuredTopItemsPerQuery : DOC_FETCH_TOP_ITEMS_PER_QUERY;

      for (const [itemIndex, item] of topItems.entries()) {
        const fallbackExcerpt = limitExcerpt(item.excerpt, excerptMaxChars);
        const hydrated = await hydrateDocsContextItem({
          stack,
          ...(resolvedVersion ? { version: resolvedVersion } : {}),
          detailLevel,
          url: item.url,
          itemIndex,
          docFetchTopItemsPerQuery,
          deadline,
          excerptMaxChars,
          fallbackExcerpt,
          stats: docFetchStats,
        });

        contextItems.push({
          title: item.title,
          url: item.url,
          source: DOCS_CONTEXT_SOURCE,
          excerpt: hydrated.excerpt,
          score: Number(item.score.toFixed(3)),
          ...(hydrated.details ? { details: hydrated.details } : {}),
        });
      }

      results.push(toQueryResult(query, contextItems));
    } catch (error) {
      if (isDocsContextConfigurationError(error)) {
        throw error;
      }

      hadQueryFailures = true;
      console.warn(`docs_context query failed: "${query}"`, error);
      results.push(toQueryResult(query, []));
    }
  }

  return {
    source: DOCS_CONTEXT_SOURCE,
    stack,
    ...(version ? { version } : {}),
    ...(resolvedVersion ? { resolvedVersion } : {}),
    detailLevel,
    queries,
    notice: buildNotice(hadQueryFailures),
    results,
  };
};
