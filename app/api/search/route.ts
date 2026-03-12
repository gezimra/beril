import { NextResponse } from "next/server";

import { listPublishedJournalPosts } from "@/lib/db/admin";
import { getAllActiveProducts } from "@/lib/db/catalog";
import { getMessages, normalizeLocale } from "@/lib/i18n";
import type { Product } from "@/types/product";

type SearchProductResult = {
  id: string;
  href: string;
  title: string;
  brand: string;
  category: Product["category"];
  price: number;
  stockStatus: Product["stockStatus"];
};

type SearchJournalResult = {
  id: string;
  href: string;
  title: string;
  excerpt: string;
};

type SearchPageResult = {
  href: string;
  label: string;
  group: "catalog" | "service" | "info";
};

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function includesQuery(value: string, normalizedQuery: string) {
  return normalizeForSearch(value).includes(normalizedQuery);
}

function scoreProduct(product: Product, normalizedQuery: string) {
  let score = 0;
  if (includesQuery(product.title, normalizedQuery)) {
    score += 8;
  }
  if (includesQuery(product.brand, normalizedQuery)) {
    score += 5;
  }
  if (includesQuery(product.shortDescription, normalizedQuery)) {
    score += 3;
  }
  if (includesQuery(product.description, normalizedQuery)) {
    score += 1;
  }
  for (const spec of product.specs) {
    if (includesQuery(spec.value, normalizedQuery) || includesQuery(spec.key, normalizedQuery)) {
      score += 2;
      break;
    }
  }
  return score;
}

function scoreJournal(
  post: { title: string; excerpt: string; content: string },
  normalizedQuery: string,
) {
  let score = 0;
  if (includesQuery(post.title, normalizedQuery)) {
    score += 8;
  }
  if (includesQuery(post.excerpt, normalizedQuery)) {
    score += 4;
  }
  if (includesQuery(post.content, normalizedQuery)) {
    score += 1;
  }
  return score;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const locale = normalizeLocale(searchParams.get("locale"));
  const messages = getMessages(locale);
  const normalizedQuery = normalizeForSearch(query);

  if (normalizedQuery.length < 2) {
    return NextResponse.json({
      query,
      results: { products: [], journal: [], pages: [] },
    });
  }

  const [products, journalPosts] = await Promise.all([
    getAllActiveProducts(),
    listPublishedJournalPosts(),
  ]);

  const productResults = products
    .map((product) => ({
      score: scoreProduct(product, normalizedQuery),
      item: {
        id: product.id,
        href: `/products/${product.slug}`,
        title: product.title,
        brand: product.brand,
        category: product.category,
        price: product.price,
        stockStatus: product.stockStatus,
      } satisfies SearchProductResult,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, 8)
    .map((entry) => entry.item);

  const journalResults = journalPosts
    .map((post) => ({
      score: scoreJournal(post, normalizedQuery),
      item: {
        id: post.id,
        href: `/journal/${post.slug}`,
        title: post.title,
        excerpt: post.excerpt,
      } satisfies SearchJournalResult,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, 5)
    .map((entry) => entry.item);

  const pageCandidates: SearchPageResult[] = [
    { href: "/watches", label: messages.nav.watches, group: "catalog" },
    { href: "/eyewear", label: messages.nav.eyewear, group: "catalog" },
    { href: "/service", label: messages.nav.service, group: "service" },
    { href: "/service/request", label: messages.mobileNav.requestRepair, group: "service" },
    { href: "/repair-track", label: messages.nav.trackRepair, group: "service" },
    { href: "/about", label: messages.nav.about, group: "info" },
    { href: "/contact", label: messages.nav.contact, group: "info" },
    { href: "/journal", label: messages.nav.journal, group: "info" },
  ];

  const pageResults = pageCandidates
    .filter((page) => includesQuery(page.label, normalizedQuery))
    .slice(0, 6);

  return NextResponse.json({
    query,
    results: {
      products: productResults,
      journal: journalResults,
      pages: pageResults,
    },
  });
}
