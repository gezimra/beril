import {
  uploadJournalCoverImageAction,
  upsertJournalPostAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminJournalPosts } from "@/lib/db/admin";
import { formatStatusLabel } from "@/lib/utils/status-label";
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
  const page = Math.max(1, parseInt(getQueryParam(query.page, "1"), 10));
  const posts = await listAdminJournalPosts({ search, status, page });

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
        <FloatInput
          label="Post title"
          name="title"
          required
        />
        <FloatInput
          label="Post slug"
          name="slug"
          required
        />
        <FloatTextarea
          label="Short excerpt"
          name="excerpt"
          rows={2}
          required
        />
        <FloatTextarea
          label="Article content"
          name="content"
          rows={6}
          required
        />
        <FloatSelect
          label="Status"
          name="status"
          defaultValue="draft"
        >
          {journalStatuses.map((item) => (
            <option key={item} value={item}>
              {formatStatusLabel(item)}
            </option>
          ))}
        </FloatSelect>
        <button
          type="submit"
          className={buttonVariants({ variant: "primary", size: "adminMd" })}
        >
          Create Post
        </button>
      </form>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]">
        <FloatInput
          label="Search title or slug"
          name="search"
          defaultValue={search}
        />
        <FloatSelect
          label="Status"
          name="status"
          defaultValue={status}
        >
          <option value="">All statuses</option>
          {journalStatuses.map((item) => (
            <option key={item} value={item}>
              {formatStatusLabel(item)}
            </option>
          ))}
        </FloatSelect>
        <button
          type="submit"
          className={buttonVariants({ variant: "mineral", size: "adminMd" })}
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
              {post.coverImage ? (
                <div
                  className="h-40 rounded-lg border border-graphite/10 bg-cover bg-center"
                  style={{ backgroundImage: `url("${post.coverImage}")` }}
                />
              ) : null}
              <FloatInput
                label="Title"
                name="title"
                defaultValue={post.title}
              />
              <FloatInput
                label="Slug"
                name="slug"
                defaultValue={post.slug}
              />
              <FloatTextarea
                label="Excerpt"
                name="excerpt"
                rows={2}
                defaultValue={post.excerpt}
              />
              <FloatTextarea
                label="Content"
                name="content"
                rows={5}
                defaultValue={post.content}
              />
              <div className="grid gap-3 sm:grid-cols-[12rem_auto]">
                <FloatSelect
                  label="Status"
                  name="status"
                  defaultValue={post.status}
                >
                  {journalStatuses.map((item) => (
                    <option key={item} value={item}>
                      {formatStatusLabel(item)}
                    </option>
                  ))}
                </FloatSelect>
                <button
                  type="submit"
                  className={buttonVariants({ variant: "secondary", size: "adminMd" })}
                >
                  Save
                </button>
              </div>
            </form>
          ))
        )}
      </div>

      {posts.length > 0 ? (
        <section className="surface-panel space-y-3 p-4">
          <h2 className="text-2xl text-graphite">Upload Cover Image</h2>
          <p className="text-sm text-graphite/72">
            Select a post and upload a cover image used on journal cards and article metadata.
          </p>
          <form
            action={uploadJournalCoverImageAction}
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <FloatSelect
              label="Select post"
              name="journalId"
              required
            >
              <option value="">Select post</option>
              {posts.map((post) => (
                <option key={`${post.id}-upload-option`} value={post.id}>
                  {post.title}
                </option>
              ))}
            </FloatSelect>
            <input
              type="file"
              name="coverImage"
              required
              accept="image/*"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className={buttonVariants({ variant: "secondary", size: "adminMd" })}
            >
              Upload
            </button>
          </form>
        </section>
      ) : null}
      <Pagination
        page={page}
        hasMore={posts.length === 30}
        searchParams={{ search: search || undefined, status: status || undefined }}
        className="surface-panel p-4"
      />
    </Container>
  );
}
