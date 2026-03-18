import {
  type DocsContextItem,
  type DocsContextQueryResult,
} from "./types.js";

export const limitExcerpt = (value: string, maxChars: number): string => {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length <= maxChars) {
    return normalized;
  }

  const boundary = normalized.lastIndexOf(" ", maxChars - 1);
  const cutoff = boundary >= Math.floor(maxChars * 0.6) ? boundary : maxChars;
  return `${normalized.slice(0, cutoff).trim()}...`;
};

const makeDetailsCoverage = (detailsCount: number, totalItems: number): string => `${detailsCount}/${totalItems}`;

export const toQueryResult = (query: string, items: DocsContextItem[]): DocsContextQueryResult => {
  const totalItems = items.length;
  const detailsCount = items.filter((item) => Boolean(item.details)).length;

  return {
    query,
    totalItems,
    detailsCount,
    detailsCoverage: makeDetailsCoverage(detailsCount, totalItems),
    items,
  };
};
