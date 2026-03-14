"use client";

import { useEffect, useRef, useState } from "react";

import {
  addProductImageUrlAction,
  deleteProductImageAction,
  uploadProductGalleryImageAction,
  upsertProductAction,
} from "@/app/admin/actions";
import { ProductImageField } from "@/components/admin/product-image-field";
import { ProductSpecsField } from "@/components/admin/product-specs-field";
import { buttonVariants } from "@/components/ui/button";
import { FloatComboboxField } from "@/components/ui/float-combobox-field";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { formatStatusLabel } from "@/lib/utils/status-label";
import type { AdminProductRow } from "@/types/admin";
import { stockStatuses } from "@/types/domain";

type Props = {
  products: AdminProductRow[];
  brandSuggestions: string[];
};

function StatusDot({ status }: { status: AdminProductRow["status"] }) {
  const colors = {
    active: "bg-emerald-500",
    draft: "bg-stone-400",
    archived: "bg-red-400",
  };
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${colors[status]}`}
      title={status}
    />
  );
}

export function AdminProductsGrid({ products, brandSuggestions }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openProduct = products.find((p) => p.id === openId) ?? null;

  useEffect(() => {
    if (openId) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [openId]);

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {products.map((product) => (
          <div key={product.id} className="surface-panel flex items-center gap-3 p-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-stone-50">
              {product.primaryImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.primaryImageUrl}
                  alt={product.primaryImageAlt ?? product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <svg className="h-4 w-4 text-graphite/18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-graphite">{product.title}</p>
              <p className="text-xs text-graphite/55">{product.brand} · {product.category}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-graphite/65">
                <span>€{product.price}</span>
                <span>·</span>
                <span>{formatStatusLabel(product.stockStatus)}</span>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <StatusDot status={product.status} />
                  <span className="capitalize">{product.status}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenId(product.id)}
              className={buttonVariants({ variant: "mineral", size: "adminSm" })}
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="surface-panel hidden overflow-x-auto p-4 md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-graphite/62">
            <tr>
              <th className="px-2 py-2">Image</th>
              <th className="px-2 py-2">Title</th>
              <th className="px-2 py-2">Brand</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Price</th>
              <th className="px-2 py-2">Stock</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-graphite/10">
                <td className="px-2 py-2">
                  <div className="h-10 w-10 overflow-hidden rounded bg-stone-50">
                    {product.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.primaryImageUrl}
                        alt={product.primaryImageAlt ?? product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-4 w-4 text-graphite/18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2 font-medium text-graphite max-w-[14rem]">
                  <p className="truncate">{product.title}</p>
                  {product.salePercentage && product.salePercentage > 0 && !product.campaignSaleOnly && (
                    <span className="mt-0.5 inline-block rounded-full bg-mineral/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-mineral">
                      -{product.salePercentage}%
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-graphite/65">{product.brand}</td>
                <td className="px-2 py-2 text-graphite/65 capitalize">{product.category}</td>
                <td className="px-2 py-2 text-graphite whitespace-nowrap">€{product.price}</td>
                <td className="px-2 py-2 text-xs text-graphite/65">{formatStatusLabel(product.stockStatus)}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={product.status} />
                    <span className="text-xs text-graphite/55 capitalize">{product.status}</span>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(product.id)}
                    className={buttonVariants({ variant: "mineral", size: "adminSm" })}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      <dialog
        ref={dialogRef}
        onClose={() => setOpenId(null)}
        onClick={(e) => { if (e.target === dialogRef.current) dialogRef.current?.close(); }}
        className="w-full max-w-3xl rounded-xl p-0 shadow-2xl"
        style={{ maxHeight: "90vh" }}
      >
        {openProduct && (
          <div className="flex max-h-[90vh] flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-graphite/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-graphite/50">Edit product</p>
                <p className="mt-0.5 text-sm font-medium text-graphite">{openProduct.title}</p>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="flex h-8 w-8 items-center justify-center rounded-full text-graphite/45 transition hover:bg-graphite/8 hover:text-graphite"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto p-5">
              <form
                action={upsertProductAction}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="id" value={openProduct.id} />

                <FloatInput
                  name="title"
                  defaultValue={openProduct.title}
                  label="Title"
                  wrapperClassName="sm:col-span-2"
                />
                <FloatComboboxField
                  name="brand"
                  defaultValue={openProduct.brand}
                  label="Brand"
                  suggestions={brandSuggestions}
                />
                <FloatSelect
                  name="category"
                  defaultValue={openProduct.category}
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
                  defaultValue={openProduct.price}
                  label="Selling price EUR"
                />
                <FloatInput
                  name="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={openProduct.purchasePrice ?? ""}
                  label="Purchase price EUR"
                />
                <FloatInput
                  name="salePercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue={openProduct.salePercentage ?? ""}
                  label="Sale % (discount)"
                />
                <FloatSelect
                  name="stockStatus"
                  defaultValue={openProduct.stockStatus}
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
                  defaultValue={openProduct.quantity ?? ""}
                  label="Quantity"
                />
                <FloatInput
                  name="warrantyMonths"
                  type="number"
                  min="0"
                  defaultValue={openProduct.warrantyMonths}
                  label="Warranty (months)"
                />
                <FloatTextarea
                  name="warrantyTerms"
                  label="Warranty terms"
                  rows={2}
                  defaultValue={openProduct.warrantyTerms ?? ""}
                  wrapperClassName="sm:col-span-2"
                />
                <FloatSelect
                  name="status"
                  defaultValue={openProduct.status}
                  label="Status"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </FloatSelect>
                <FloatSelect
                  name="primaryCtaMode"
                  defaultValue={openProduct.primaryCtaMode}
                  label="CTA Mode"
                >
                  <option value="add_to_cart">Add To Cart</option>
                  <option value="reserve_in_store">Reserve In Store</option>
                  <option value="whatsapp_inquiry">WhatsApp Inquiry</option>
                  <option value="request_availability">Request Availability</option>
                </FloatSelect>
                <FloatInput
                  name="primaryImageAlt"
                  defaultValue={openProduct.primaryImageAlt ?? ""}
                  label="Primary image alt"
                  wrapperClassName="sm:col-span-2"
                />

                <div className="sm:col-span-2">
                  <p className="mb-1.5 text-xs uppercase tracking-[0.12em] text-graphite/50">Specs</p>
                  <ProductSpecsField defaultSpecs={openProduct.specs} />
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-graphite/74">
                    <input type="checkbox" name="featured" defaultChecked={openProduct.featured} />
                    featured
                  </label>
                  <label className="flex items-center gap-2 text-sm text-graphite/74">
                    <input type="checkbox" name="isNew" defaultChecked={openProduct.isNew} />
                    new
                  </label>
                  <label className="flex items-center gap-2 text-sm text-graphite/74">
                    <input
                      type="checkbox"
                      name="campaignSaleOnly"
                      defaultChecked={openProduct.campaignSaleOnly}
                    />
                    campaign overrides sale %
                  </label>
                </div>

                <button
                  type="submit"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "adminMd",
                    className: "sm:col-span-2",
                  })}
                >
                  Save changes
                </button>
              </form>

              {/* Images */}
              <div className="mt-4">
                <p className="mb-1.5 text-xs uppercase tracking-[0.12em] text-graphite/50">Images</p>
                <ProductImageField
                  productId={openProduct.id}
                  productTitle={openProduct.title}
                  imageUrls={openProduct.imageUrls}
                  deleteAction={deleteProductImageAction}
                  addUrlAction={addProductImageUrlAction}
                  uploadAction={uploadProductGalleryImageAction}
                />
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
