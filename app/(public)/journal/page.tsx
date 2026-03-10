import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import { listPublishedJournalPosts } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Insights on watches, eyewear, and service care from BERIL in Gjilan.",
};

export default async function JournalPage() {
  const posts = await listPublishedJournalPosts();

  return (
    <SectionWrapper className="py-16">
      <Container className="space-y-8">
        <header className="space-y-4">
          <StatusBadge tone="premium">Journal</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">Guides and Insights</h1>
          <p className="max-w-3xl text-sm text-graphite/76 sm:text-base">
            Educational content to help you choose, maintain, and care for watches and
            eyewear.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {posts.length === 0 ? (
            <article className="surface-panel p-6 text-sm text-graphite/72">
              No published posts yet.
            </article>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="surface-panel p-6">
                <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString()
                    : "Draft"}
                </p>
                <h2 className="mt-3 text-3xl text-graphite">{post.title}</h2>
                <p className="mt-3 text-sm text-graphite/75">{post.excerpt}</p>
                <Link
                  href={`/journal/${post.slug}`}
                  className="mt-5 inline-flex h-10 items-center rounded-full border border-graphite/18 bg-white/85 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
                >
                  Read article
                </Link>
              </article>
            ))
          )}
        </div>
      </Container>
    </SectionWrapper>
  );
}
