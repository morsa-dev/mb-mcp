export const DOCS_CONTEXT_TOOL_NAME = "docs_context" as const;
export const DOCS_CONTEXT_SOURCE = "official_docs" as const;

export const DOCS_CONTEXT_SUPPORTED_STACKS = ["ios"] as const;
export type DocsContextStack = (typeof DOCS_CONTEXT_SUPPORTED_STACKS)[number];
export const DEFAULT_STACK: DocsContextStack = "ios";

export const DOCS_CONTEXT_DETAIL_LEVELS = ["compact", "structured"] as const;
export type DocsContextDetailLevel = (typeof DOCS_CONTEXT_DETAIL_LEVELS)[number];
export const DEFAULT_DETAIL_LEVEL: DocsContextDetailLevel = "compact";

export const DEFAULT_MAX_ITEMS_PER_QUERY = 3;
export const DEFAULT_EXCERPT_MAX_CHARS = 260;
export const MAX_QUERIES_PER_CALL = 8;
export const MAX_TOTAL_LOOKUP_BUDGET_MS = 20_000;
export const MAX_PER_QUERY_TIMEOUT_MS = 5_000;
export const PER_QUERY_RETRIES = 0;
export const DOC_FETCH_TOP_ITEMS_PER_QUERY = 2;
export const STRUCTURED_TOP_ITEMS_PER_QUERY_MAX = 5;
export const DOC_FETCH_MAX_TOTAL_ATTEMPTS = 12;
export const DOC_FETCH_TIMEOUT_MS = 2_500;
export const DOC_FETCH_RETRIES = 0;
export const DOC_FETCH_MIN_REMAINING_BUDGET_MS = 700;
export const DOC_FETCH_CACHE_TTL_MS = 10 * 60 * 1_000;
export const DOC_FETCH_CACHE_MAX_ENTRIES = 200;
export const DEFAULT_NOTICE = "Relevant excerpts retrieved from official documentation.";

export type DocsContextItemDetails = {
  summary?: string;
  declaration?: string;
  codeExample?: string;
  deprecation?: string;
};

export type DocsContextItem = {
  title: string;
  url: string;
  source: typeof DOCS_CONTEXT_SOURCE;
  excerpt: string;
  score: number;
  details?: DocsContextItemDetails;
};

export type DocsContextQueryResult = {
  query: string;
  totalItems: number;
  detailsCount: number;
  detailsCoverage: string;
  items: DocsContextItem[];
};

export type DocsContextPayload = {
  source: typeof DOCS_CONTEXT_SOURCE;
  stack: DocsContextStack;
  detailLevel: DocsContextDetailLevel;
  queries: string[];
  notice: string;
  results: DocsContextQueryResult[];
};
