import {
  uploadProductGalleryImageAction,
  uploadProductPrimaryImageAction,
  upsertProductAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminProducts } from "@/lib/db/admin";
import { formatStatusLabel } from "@/lib/utils/status-label";
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
        <FloatInput
          name="title"
          required
          label="Title"
        />
        <FloatInput
          name="brand"
          required
          label="Brand"
        />
        <FloatSelect
          name="category"
          defaultValue="watch"
          label="Category"
        >
          <option value="watch">watch</option>
          <option value="eyewear">eyewear</option>
        </FloatSelect>
        <FloatInput
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          label="Price EUR"
        />
        <FloatSelect
          name="stockStatus"
          defaultValue="in_stock"
          label="Stock Status"
        >
          {stockStatuses.map((item) => (
            <option key={item} value={item}>
              {formatStatusLabel(item)}
            </option>
          ))}
        </FloatSelect>
        <FloatInput
          name="quantity"
          type="number"
          min="0"
          label="Quantity"
        />
        <FloatInput
          name="primaryImageAlt"
          label="Primary image alt text"
          wrapperClassName="sm:col-span-2"
        />
        <FloatTextarea
          name="specsRaw"
          rows={4}
          label="Specs (one per line)"
          wrapperClassName="sm:col-span-2"
        />
        <FloatSelect
          name="status"
          defaultValue="active"
          label="Status"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </FloatSelect>
        <FloatSelect
          name="primaryCtaMode"
          defaultValue="add_to_cart"
          label="Primary CTA Mode"
        >
          <option value="add_to_cart">Add To Cart</option>
          <option value="reserve_in_store">Reserve In Store</option>
          <option value="whatsapp_inquiry">WhatsApp Inquiry</option>
          <option value="request_availability">Request Availability</option>
        </FloatSelect>
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
        <FloatInput
          name="search"
          defaultValue={search}
          label="Search by title, brand, slug"
        />
        <FloatSelect
          name="status"
          defaultValue={status}
          label="Status"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </FloatSelect>
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
                <FloatInput
                  name="title"
                  defaultValue={product.title}
                  label="Title"
                  wrapperClassName="md:col-span-2"
                />
                <FloatInput
                  name="brand"
                  defaultValue={product.brand}
                  label="Brand"
                />
                <FloatSelect
                  name="category"
                  defaultValue={product.category}
                  label="Category"
                >
                  <option value="watch">watch</option>
                  <option value="eyewear">eyewear</option>
                </FloatSelect>
                <FloatInput
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product.price}
                  label="Price"
                />
                <FloatSelect
                  name="stockStatus"
                  defaultValue={product.stockStatus}
                  label="Stock Status"
                >
                  {stockStatuses.map((item) => (
                    <option key={item} value={item}>
                      {formatStatusLabel(item)}
                    </option>
                  ))}
                </FloatSelect>
                <FloatInput
                  name="quantity"
                  type="number"
                  min="0"
                  defaultValue={product.quantity ?? ""}
                  label="Quantity"
                />
                <FloatSelect
                  name="status"
                  defaultValue={product.status}
                  label="Status"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </FloatSelect>
                <FloatSelect
                  name="primaryCtaMode"
                  defaultValue={product.primaryCtaMode}
                  label="Primary CTA Mode"
                >
                  <option value="add_to_cart">Add To Cart</option>
                  <option value="reserve_in_store">Reserve In Store</option>
                  <option value="whatsapp_inquiry">WhatsApp Inquiry</option>
                  <option value="request_availability">Request Availability</option>
                </FloatSelect>
                <FloatInput
                  name="primaryImageAlt"
                  defaultValue={product.primaryImageAlt ?? ""}
                  label="Primary image alt"
                  wrapperClassName="md:col-span-2"
                />
                <FloatTextarea
                  name="specsRaw"
                  rows={3}
                  defaultValue={product.specs
                    .map((spec) => `${spec.key}: ${spec.value}`)
                    .join("\n")}
                  label="Specs (one per line)"
                  wrapperClassName="md:col-span-4"
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
                <FloatInput
                  name="imageAlt"
                  defaultValue={product.primaryImageAlt ?? `${product.title} product image`}
                  label="Primary image alt text"
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

              <form
                action={uploadProductGalleryImageAction}
                className="mt-2 grid gap-2 rounded-lg border border-graphite/12 bg-white/70 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <input type="hidden" name="productId" value={product.id} />
                <FloatInput
                  name="imageAlt"
                  defaultValue={`${product.title} gallery image`}
                  label="Gallery image alt text"
                />
                <input
                  type="file"
                  name="galleryImageFile"
                  accept="image/*"
                  required
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-graphite/18 bg-white/85 px-4 text-xs uppercase tracking-[0.12em] text-graphite"
                >
                  Add Gallery Image
                </button>
                {product.imageUrls.length > 0 ? (
                  <div className="md:col-span-3 flex flex-wrap gap-2">
                    {product.imageUrls.map((url, index) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-graphite/72 underline"
                      >
                        Image {index + 1}
                      </a>
                    ))}
                  </div>
                ) : null}
              </form>
            </article>
          ))
        )}
      </div>
    </Container>
  );
}
