import { upsertJournalPostAction } from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminJournalPosts } from "@/lib/db/admin";
import { journalStatuses } from "@/types/domain";

type AdminJournalPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(
  value: string | string[] | undefined,
  fallback = "",
): string {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminJournalPage({
  searchParams,
}: AdminJournalPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);
  const posts = await listAdminJournalPosts({ search, status });

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Journal</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Journal Editor</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Create, edit, and publish educational posts for SEO and authority.
        </p>
      </header>

      <form action={upsertJournalPostAction} className="surface-panel grid gap-3 p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">
          Create post
        </p>
        <input
          name="title"
          required
          placeholder="Post title"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="slug"
          required
          placeholder="post-slug"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <textarea
          name="excerpt"
          rows={2}
          required
          placeholder="Short excerpt"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <textarea
          name="content"
          rows={6}
          required
          placeholder="Article content"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue="draft"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          {journalStatuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Create Post
        </button>
      </form>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search title or slug"
          className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {journalStatuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-mineral px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Apply
        </button>
      </form>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="surface-panel p-6 text-sm text-graphite/75">No posts found.</div>
        ) : (
          posts.map((post) => (
            <form key={post.id} action={upsertJournalPostAction} className="surface-panel grid gap-3 p-4">
              <input type="hidden" name="id" value={post.id} />
              <input
                name="title"
                defaultValue={post.title}
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="slug"
                defaultValue={post.slug}
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <textarea
                name="excerpt"
                rows={2}
                defaultValue={post.excerpt}
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <textarea
                name="content"
                rows={5}
                defaultValue={post.content}
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <div className="grid gap-3 sm:grid-cols-[12rem_auto]">
                <select
                  name="status"
                  defaultValue={post.status}
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  {journalStatuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-graphite/18 bg-white/85 px-5 text-xs uppercase tracking-[0.12em] text-graphite"
                >
                  Save
                </button>
              </div>
            </form>
          ))
        )}
      </div>
    </Container>
  );
}
