import {
  uploadProductPrimaryImageAction,
  upsertProductAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminProducts } from "@/lib/db/admin";
import { stockStatuses } from "@/types/domain";

type AdminProductsPageProps = {
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

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);
  const products = await listAdminProducts({ search, status });

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Products</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Products Management</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Create new products and update stock, pricing, and merchandising flags.
        </p>
      </header>

      <form action={upsertProductAction} className="surface-panel grid gap-3 p-4 sm:grid-cols-2">
        <p className="sm:col-span-2 text-xs uppercase tracking-[0.14em] text-graphite/62">
          Create product
        </p>
        <input
          name="title"
          required
          placeholder="Title"
          className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="brand"
          required
          placeholder="Brand"
          className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue="watch"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          <option value="watch">watch</option>
          <option value="eyewear">eyewear</option>
        </select>
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="Price EUR"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <select
          name="stockStatus"
          defaultValue="in_stock"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          {stockStatuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          name="quantity"
          type="number"
          min="0"
          placeholder="Quantity"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="primaryImageUrl"
          type="url"
          placeholder="Primary image URL"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <input
          name="primaryImageAlt"
          placeholder="Primary image alt text"
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <textarea
          name="imageUrlsRaw"
          rows={4}
          placeholder={
            "Ordered image URLs (top = first gallery image)\nhttps://...\nhttps://..."
          }
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 font-mono text-xs"
        />
        <textarea
          name="specsRaw"
          rows={4}
          placeholder={"Specs (one per line)\nmovement: Automatic\ncase_size: 40mm"}
          className="sm:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 font-mono text-xs"
        />
        <select
          name="status"
          defaultValue="active"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="archived">archived</option>
        </select>
        <select
          name="primaryCtaMode"
          defaultValue="add_to_cart"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          <option value="add_to_cart">add_to_cart</option>
          <option value="reserve_in_store">reserve_in_store</option>
          <option value="whatsapp_inquiry">whatsapp_inquiry</option>
          <option value="request_availability">request_availability</option>
        </select>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-graphite/74">
            <input type="checkbox" name="featured" />
            featured
          </label>
          <label className="flex items-center gap-2 text-sm text-graphite/74">
            <input type="checkbox" name="isNew" />
            new
          </label>
        </div>
        <button
          type="submit"
          className="sm:col-span-2 inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Create Product
        </button>
      </form>

      <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_13rem_auto]">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by title, brand, slug"
          className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="archived">archived</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-mineral px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Apply
        </button>
      </form>

      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="surface-panel p-6 text-sm text-graphite/75">
            No products found for current filters.
          </div>
        ) : (
          products.map((product) => (
            <article key={product.id} className="surface-panel p-4">
              <form action={upsertProductAction} className="grid gap-3 md:grid-cols-10">
                <input type="hidden" name="id" value={product.id} />
                <input
                  name="title"
                  defaultValue={product.title}
                  className="md:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                <input
                  name="brand"
                  defaultValue={product.brand}
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                <select
                  name="category"
                  defaultValue={product.category}
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="watch">watch</option>
                  <option value="eyewear">eyewear</option>
                </select>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product.price}
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                <select
                  name="stockStatus"
                  defaultValue={product.stockStatus}
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  {stockStatuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  defaultValue={product.quantity ?? ""}
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                <select
                  name="status"
                  defaultValue={product.status}
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
                <select
                  name="primaryCtaMode"
                  defaultValue={product.primaryCtaMode}
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  <option value="add_to_cart">add_to_cart</option>
                  <option value="reserve_in_store">reserve_in_store</option>
                  <option value="whatsapp_inquiry">whatsapp_inquiry</option>
                  <option value="request_availability">request_availability</option>
                </select>
                <input
                  name="primaryImageUrl"
                  type="url"
                  defaultValue={product.primaryImageUrl ?? ""}
                  placeholder="Primary image URL"
                  className="md:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                <input
                  name="primaryImageAlt"
                  defaultValue={product.primaryImageAlt ?? ""}
                  placeholder="Primary image alt"
                  className="md:col-span-2 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                <textarea
                  name="imageUrlsRaw"
                  rows={3}
                  defaultValue={product.imageUrls.join("\n")}
                  placeholder="Ordered image URLs (top = first gallery image)"
                  className="md:col-span-4 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 font-mono text-xs"
                />
                <textarea
                  name="specsRaw"
                  rows={3}
                  defaultValue={product.specs
                    .map((spec) => `${spec.key}: ${spec.value}`)
                    .join("\n")}
                  placeholder={"Specs (one per line)\nkey: value"}
                  className="md:col-span-4 rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 font-mono text-xs"
                />
                <div className="md:col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-graphite/74">
                    <input type="checkbox" name="featured" defaultChecked={product.featured} />
                    featured
                  </label>
                  <label className="flex items-center gap-2 text-sm text-graphite/74">
                    <input type="checkbox" name="isNew" defaultChecked={product.isNew} />
                    new
                  </label>
                </div>
                <button
                  type="submit"
                  className="md:col-span-2 inline-flex h-10 items-center justify-center rounded-full border border-graphite/18 bg-white/85 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
                >
                  Save
                </button>
              </form>

              <form
                action={uploadProductPrimaryImageAction}
                className="mt-3 grid gap-2 rounded-lg border border-graphite/12 bg-white/70 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <input type="hidden" name="productId" value={product.id} />
                <input
                  name="imageAlt"
                  defaultValue={product.primaryImageAlt ?? `${product.title} product image`}
                  placeholder="Primary image alt text"
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                />
                <input
                  type="file"
                  name="primaryImageFile"
                  accept="image/*"
                  required
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-graphite/18 bg-white/85 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
                >
                  Upload Image
                </button>
                {product.primaryImageUrl ? (
                  <a
                    href={product.primaryImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="md:col-span-3 text-xs text-graphite/72 underline"
                  >
                    Current image
                  </a>
                ) : null}
              </form>
            </article>
          ))
        )}
      </div>
    </Container>
  );
}
