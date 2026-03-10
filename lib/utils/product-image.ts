interface ProductImageFallbackInput {
  imageUrl?: string | null;
  brand: string;
  title: string;
  category: "watch" | "eyewear";
}

const placeholderPath = "/placeholders/product-default.svg";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function lineClamp(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function buildProductPlaceholderSvg({
  brand,
  title,
  category,
}: Omit<ProductImageFallbackInput, "imageUrl">) {
  const safeBrand = escapeXml(lineClamp(brand.toUpperCase(), 18));
  const safeTitle = escapeXml(lineClamp(title, 28));
  const categoryLabel = category === "watch" ? "WATCH COLLECTION" : "EYEWEAR COLLECTION";
  const accent = category === "watch" ? "#6C4F3A" : "#2F4B44";

  return `
    <svg width="1200" height="1500" viewBox="0 0 1200 1500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="1500" fill="#F4F0E8"/>
      <rect x="58" y="58" width="1084" height="1384" rx="34" fill="#EEE7DB"/>
      <rect x="114" y="114" width="972" height="1272" rx="26" fill="#E3DACD"/>
      <rect x="166" y="166" width="868" height="980" rx="22" fill="#DDD4C7"/>
      <circle cx="600" cy="538" r="172" fill="#D2C8BA"/>
      <text x="600" y="318" text-anchor="middle" fill="${accent}" font-size="34" font-family="Arial, sans-serif" letter-spacing="8">${categoryLabel}</text>
      <text x="600" y="560" text-anchor="middle" fill="#2C2C2C" font-size="84" font-family="Georgia, serif" letter-spacing="12">${safeBrand}</text>
      <text x="600" y="1238" text-anchor="middle" fill="#2C2C2C" font-size="52" font-family="Georgia, serif">${safeTitle}</text>
      <rect x="390" y="1294" width="420" height="20" rx="10" fill="${accent}" fill-opacity="0.8"/>
      <rect x="454" y="1338" width="292" height="14" rx="7" fill="#2C2C2C" fill-opacity="0.28"/>
    </svg>
  `;
}

export function getProductImageUrl({
  imageUrl,
  brand,
  title,
  category,
}: ProductImageFallbackInput) {
  if (imageUrl && imageUrl !== placeholderPath) {
    return imageUrl;
  }

  const svg = buildProductPlaceholderSvg({ brand, title, category });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
