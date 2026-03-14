import { upsertProductAction } from "@/app/admin/actions";
import { AdminProductsGrid } from "@/components/admin/admin-products-grid";
import { ProductSpecsField } from "@/components/admin/product-specs-field";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { FloatComboboxField } from "@/components/ui/float-combobox-field";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminBrandSuggestions, listAdminProducts } from "@/lib/db/admin";
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
  const page = Math.max(1, parseInt(getQueryParam(query.page, "1"), 10));
  const [products, brandSuggestions] = await Promise.all([
    listAdminProducts({ search, status, page }),
    listAdminBrandSuggestions(),
  ]);

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
        <FloatComboboxField
          name="brand"
          required
          label="Brand"
          suggestions={brandSuggestions}
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
          label="Selling price EUR"
        />
        <FloatInput
          name="purchasePrice"
          type="number"
          min="0"
          step="0.01"
          label="Purchase price EUR"
        />
        <FloatInput
          name="salePercentage"
          type="number"
          min="0"
          max="100"
          step="0.1"
          label="Sale % (discount)"
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
          name="warrantyMonths"
          type="number"
          min="0"
          label="Warranty (months)"
          defaultValue={12}
        />
        <FloatTextarea
          name="warrantyTerms"
          label="Warranty terms (optional)"
          rows={2}
          wrapperClassName="sm:col-span-2"
        />
        <FloatInput
          name="primaryImageAlt"
          label="Primary image alt text"
          wrapperClassName="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs uppercase tracking-[0.12em] text-graphite/50">Specs</p>
          <ProductSpecsField defaultSpecs={[]} />
        </div>
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
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-graphite/74">
            <input type="checkbox" name="featured" />
            featured
          </label>
          <label className="flex items-center gap-2 text-sm text-graphite/74">
            <input type="checkbox" name="isNew" />
            new
          </label>
          <label className="flex items-center gap-2 text-sm text-graphite/74">
            <input type="checkbox" name="campaignSaleOnly" />
            campaign overrides sale %
          </label>
        </div>
        <button
          type="submit"
          className={buttonVariants({ variant: "primary", size: "adminMd", className: "sm:col-span-2" })}
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
          className={buttonVariants({ variant: "mineral", size: "adminMd" })}
        >
          Apply
        </button>
      </form>

      {products.length === 0 ? (
        <div className="surface-panel p-6 text-sm text-graphite/75">
          No products found for current filters.
        </div>
      ) : (
        <AdminProductsGrid products={products} brandSuggestions={brandSuggestions} />
      )}

      <Pagination
        page={page}
        hasMore={products.length === 40}
        searchParams={{ search: search || undefined, status: status || undefined }}
        className="surface-panel p-4"
      />
    </Container>
  );
}
