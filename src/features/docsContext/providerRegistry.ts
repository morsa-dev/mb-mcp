import {
  fetchAngularDocumentationSnippet,
  fetchAngularDocumentationStructuredContext,
  type AngularDocStructuredContext,
} from "../../adapters/angularDocs/content.js";
import {
  resolveAngularDocsVersion,
  searchAngularDocs,
  type AngularDocsSearchResult,
} from "../../adapters/angularDocs/search.js";
import {
  fetchAppleDocumentationSnippet,
  fetchAppleDocumentationStructuredContext,
  type AppleDocStructuredContext,
} from "../../adapters/appleDocs/content.js";
import {
  searchAppleDeveloperDocs,
  type AppleDocsSearchResult,
} from "../../adapters/appleDocs/search.js";
import type { DocsContextStack } from "./types.js";

export type DocsContextSearchOptions = {
  version?: string;
  maxResults?: number;
  excerptMaxChars?: number;
  timeoutMs?: number;
  retries?: number;
};

export type DocsContextContentOptions = {
  version?: string;
  timeoutMs?: number;
  retries?: number;
  maxChars?: number;
};

export type DocsContextSearchResult = AppleDocsSearchResult | AngularDocsSearchResult;
export type DocsContextStructuredContext = AppleDocStructuredContext | AngularDocStructuredContext;

export type DocsContextProvider = {
  resolveVersion: (version: string | undefined) => string | undefined;
  search: (query: string, options?: DocsContextSearchOptions) => Promise<DocsContextSearchResult[]>;
  fetchSnippet: (docUrl: string, options?: DocsContextContentOptions) => Promise<string | null>;
  fetchStructuredContext: (
    docUrl: string,
    options?: DocsContextContentOptions,
  ) => Promise<DocsContextStructuredContext | null>;
};

const docsContextProviders: Record<DocsContextStack, DocsContextProvider> = {
  ios: {
    resolveVersion: (version) => {
      const normalized = version?.trim();
      return normalized ? normalized : undefined;
    },
    search: async (query, options = {}) =>
      searchAppleDeveloperDocs(query, {
        type: "documentation",
        ...(options.maxResults !== undefined ? { maxResults: options.maxResults } : {}),
        ...(options.excerptMaxChars !== undefined ? { excerptMaxChars: options.excerptMaxChars } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        ...(options.retries !== undefined ? { retries: options.retries } : {}),
      }),
    fetchSnippet: async (docUrl, options = {}) =>
      fetchAppleDocumentationSnippet(docUrl, {
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        ...(options.retries !== undefined ? { retries: options.retries } : {}),
        ...(options.maxChars !== undefined ? { maxChars: options.maxChars } : {}),
      }),
    fetchStructuredContext: async (docUrl, options = {}) =>
      fetchAppleDocumentationStructuredContext(docUrl, {
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        ...(options.retries !== undefined ? { retries: options.retries } : {}),
        ...(options.maxChars !== undefined ? { maxChars: options.maxChars } : {}),
      }),
  },
  angular: {
    resolveVersion: (version) => resolveAngularDocsVersion(version),
    search: async (query, options = {}) =>
      searchAngularDocs(query, {
        ...(options.version !== undefined ? { version: options.version } : {}),
        ...(options.maxResults !== undefined ? { maxResults: options.maxResults } : {}),
        ...(options.excerptMaxChars !== undefined ? { excerptMaxChars: options.excerptMaxChars } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        ...(options.retries !== undefined ? { retries: options.retries } : {}),
      }),
    fetchSnippet: async (docUrl, options = {}) =>
      fetchAngularDocumentationSnippet(docUrl, {
        ...(options.version !== undefined ? { version: options.version } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        ...(options.retries !== undefined ? { retries: options.retries } : {}),
        ...(options.maxChars !== undefined ? { maxChars: options.maxChars } : {}),
      }),
    fetchStructuredContext: async (docUrl, options = {}) =>
      fetchAngularDocumentationStructuredContext(docUrl, {
        ...(options.version !== undefined ? { version: options.version } : {}),
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
        ...(options.retries !== undefined ? { retries: options.retries } : {}),
        ...(options.maxChars !== undefined ? { maxChars: options.maxChars } : {}),
      }),
  },
};

export const getDocsContextProvider = (stack: DocsContextStack): DocsContextProvider => docsContextProviders[stack];
