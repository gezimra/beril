import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getPublishedJournalPostBySlug,
  listPublishedJournalPosts,
} from "@/lib/db/admin";
import { env } from "@/lib/env";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/structured-data";

type JournalDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const siteUrl = env.client.siteUrl.replace(/\/+$/, "");

export async function generateMetadata({
  params,
}: JournalDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedJournalPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/journal/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [{ url: post.coverImage ?? "/placeholders/product-default.svg" }],
    },
  };
}

export async function generateStaticParams() {
  const posts = await listPublishedJournalPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function JournalDetailPage({ params }: JournalDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedJournalPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const articleLd = articleJsonLd(post);
  const breadcrumbLd = breadcrumbJsonLd([
    { position: 1, name: "Home", item: `${siteUrl}/` },
    { position: 2, name: "Journal", item: `${siteUrl}/journal` },
    { position: 3, name: post.title, item: `${siteUrl}/journal/${post.slug}` },
  ]);

  return (
    <>
      <Script id={`journal-article-${post.slug}`} type="application/ld+json">
        {JSON.stringify(articleLd)}
      </Script>
      <Script id={`journal-breadcrumb-${post.slug}`} type="application/ld+json">
        {JSON.stringify(breadcrumbLd)}
      </Script>

      <SectionWrapper className="py-16">
        <Container className="max-w-4xl space-y-6">
          <StatusBadge tone="premium">Journal Article</StatusBadge>
          <h1 className="text-5xl text-graphite sm:text-6xl">{post.title}</h1>
          <p className="text-sm text-graphite/72">
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString()
              : new Date(post.createdAt).toLocaleDateString()}
          </p>
          {post.coverImage ? (
            <div
              className="h-64 rounded-xl border border-graphite/12 bg-cover bg-center"
              style={{ backgroundImage: `url("${post.coverImage}")` }}
            />
          ) : null}
          <article className="surface-panel p-7">
            <p className="text-sm leading-8 text-graphite/78">{post.content}</p>
          </article>
        </Container>
      </SectionWrapper>
    </>
  );
}
