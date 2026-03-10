import { upsertProductAction } from "@/app/admin/actions";
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
        <select
          name="status"
          defaultValue="active"
          className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
        >
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="archived">archived</option>
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
            <form key={product.id} action={upsertProductAction} className="surface-panel grid gap-3 p-4 md:grid-cols-8">
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
          ))
        )}
      </div>
    </Container>
  );
}
