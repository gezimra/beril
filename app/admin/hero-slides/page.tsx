import {
  deleteHeroSlideAction,
  upsertHeroSlideAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminHeroSlides, listAdminProducts } from "@/lib/db/admin";
import { formatStatusLabel } from "@/lib/utils/status-label";
import { heroSlideStatuses, heroSlideTypes } from "@/types/domain";

export default async function AdminHeroSlidesPage() {
  const [slides, products] = await Promise.all([
    listAdminHeroSlides(),
    listAdminProducts({ status: "active" }),
  ]);

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="premium">Hero</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Hero Carousel</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Manage homepage hero slides. Active slides display in sort order.
        </p>
      </header>

      <form action={upsertHeroSlideAction} className="surface-panel grid gap-3 p-5 sm:grid-cols-2">
        <p className="sm:col-span-2 text-xs uppercase tracking-[0.14em] text-graphite/62">
          New Slide
        </p>
        <FloatSelect label="Slide type" name="slideType">
          {heroSlideTypes.map((t) => (
            <option key={t} value={t}>
              {formatStatusLabel(t)}
            </option>
          ))}
        </FloatSelect>
        <FloatSelect label="Status" name="status">
          {heroSlideStatuses.map((s) => (
            <option key={s} value={s}>
              {formatStatusLabel(s)}
            </option>
          ))}
        </FloatSelect>
        <FloatInput label="Sort order" name="sortOrder" type="number" min={0} defaultValue={0} />
        <FloatInput label="Headline" name="headline" />
        <FloatTextarea label="Subheadline" name="subheadline" rows={2} wrapperClassName="sm:col-span-2" />
        <FloatInput label="CTA label" name="ctaLabel" />
        <FloatInput label="CTA href" name="ctaHref" />
        <FloatInput label="Secondary CTA label" name="secondaryCtaLabel" />
        <FloatInput label="Secondary CTA href" name="secondaryCtaHref" />
        <FloatInput label="Image alt text" name="backgroundImageAlt" />
        <FloatSelect label="Product (for spotlight)" name="productId" wrapperClassName="sm:col-span-2">
          <option value="">No product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand} {p.title}
            </option>
          ))}
        </FloatSelect>
        <div className="sm:col-span-2 grid gap-2 sm:grid-cols-3 rounded-lg border border-graphite/10 bg-white/60 p-3">
          <p className="sm:col-span-3 text-xs uppercase tracking-[0.14em] text-graphite/62">
            Media uploads (optional)
          </p>
          <div className="space-y-1">
            <p className="text-xs text-graphite/72">Background image</p>
            <input
              type="file"
              name="backgroundImageFile"
              accept="image/*"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-graphite/72">Video poster</p>
            <input
              type="file"
              name="videoPosterFile"
              accept="image/*"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-graphite/72">Video</p>
            <input
              type="file"
              name="videoFile"
              accept="video/*"
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm w-full"
            />
          </div>
        </div>
        <button
          type="submit"
          className="sm:col-span-2 inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
        >
          Create Slide
        </button>
      </form>

      <section className="surface-panel p-5">
        <h2 className="text-2xl text-graphite">Current Slides</h2>
        {slides.length === 0 ? (
          <p className="mt-3 text-sm text-graphite/72">
            No slides configured. The default content hero will be shown.
          </p>
        ) : (
          <ul className="mt-4 space-y-4 text-sm">
            {slides.map((slide) => (
              <li
                key={slide.id}
                className="space-y-3 rounded-lg border border-graphite/10 bg-white/75 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-graphite">
                      #{slide.sortOrder} &middot; {formatStatusLabel(slide.slideType)}
                    </span>
                    <span className="ml-2 text-graphite/60">
                      ({formatStatusLabel(slide.status)})
                    </span>
                  </div>
                  <form action={deleteHeroSlideAction}>
                    <input type="hidden" name="slideId" value={slide.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-600/80 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </form>
                </div>
                {slide.headline && (
                  <p className="text-graphite/80">{slide.headline}</p>
                )}

                <form
                  action={upsertHeroSlideAction}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={slide.id} />
                  <FloatSelect label="Slide type" name="slideType" defaultValue={slide.slideType}>
                    {heroSlideTypes.map((t) => (
                      <option key={t} value={t}>
                        {formatStatusLabel(t)}
                      </option>
                    ))}
                  </FloatSelect>
                  <FloatSelect label="Status" name="status" defaultValue={slide.status}>
                    {heroSlideStatuses.map((s) => (
                      <option key={s} value={s}>
                        {formatStatusLabel(s)}
                      </option>
                    ))}
                  </FloatSelect>
                  <FloatInput label="Sort order" name="sortOrder" type="number" min={0} defaultValue={slide.sortOrder} />
                  <FloatInput label="Headline" name="headline" defaultValue={slide.headline ?? ""} />
                  <FloatTextarea label="Subheadline" name="subheadline" defaultValue={slide.subheadline ?? ""} rows={2} wrapperClassName="sm:col-span-2" />
                  <FloatInput label="CTA label" name="ctaLabel" defaultValue={slide.ctaLabel ?? ""} />
                  <FloatInput label="CTA href" name="ctaHref" defaultValue={slide.ctaHref ?? ""} />
                  <FloatInput label="Secondary CTA label" name="secondaryCtaLabel" defaultValue={slide.secondaryCtaLabel ?? ""} />
                  <FloatInput label="Secondary CTA href" name="secondaryCtaHref" defaultValue={slide.secondaryCtaHref ?? ""} />
                  <FloatInput label="Image alt text" name="backgroundImageAlt" defaultValue={slide.backgroundImageAlt ?? ""} />
                  <FloatSelect label="Product" name="productId" defaultValue={slide.productId ?? ""} wrapperClassName="sm:col-span-2">
                    <option value="">No product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.brand} {p.title}
                      </option>
                    ))}
                  </FloatSelect>
                  <div className="sm:col-span-2 grid gap-2 sm:grid-cols-3 rounded-lg border border-graphite/10 bg-white/60 p-3">
                    <p className="sm:col-span-3 text-xs uppercase tracking-[0.14em] text-graphite/62">
                      Media uploads
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-graphite/72">Background image</p>
                      <input
                        type="file"
                        name="backgroundImageFile"
                        accept="image/*"
                        className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm w-full"
                      />
                      {slide.backgroundImageUrl ? (
                        <a href={slide.backgroundImageUrl} target="_blank" rel="noreferrer" className="text-xs text-graphite/60 underline">
                          Current image
                        </a>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-graphite/72">Video poster</p>
                      <input
                        type="file"
                        name="videoPosterFile"
                        accept="image/*"
                        className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm w-full"
                      />
                      {slide.videoPosterUrl ? (
                        <a href={slide.videoPosterUrl} target="_blank" rel="noreferrer" className="text-xs text-graphite/60 underline">
                          Current poster
                        </a>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-graphite/72">Video</p>
                      <input
                        type="file"
                        name="videoFile"
                        accept="video/*"
                        className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm w-full"
                      />
                      {slide.videoUrl ? (
                        <a href={slide.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-graphite/60 underline">
                          Current video
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="sm:col-span-2 inline-flex h-10 items-center justify-center rounded-full bg-mineral px-5 text-xs uppercase tracking-[0.12em] text-white"
                  >
                    Update Slide
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
