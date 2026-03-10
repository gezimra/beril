insert into public.site_settings (key, value)
values
  ('business.name', 'BERIL'),
  ('hero.headline', 'Precision in Time & Vision'),
  ('hero.subheadline', 'Ora te kuruara, syze te rafinuara dhe servis i besuar ne Gjilan.'),
  ('hero.primary_cta_label', 'Shop Watches'),
  ('hero.primary_cta_href', '/watches'),
  ('hero.secondary_cta_label', 'Request Repair'),
  ('hero.secondary_cta_href', '/service/request'),
  ('home.trust_points', '["Dyqan fizik ne qender te Gjilanit","Servis real per ore dhe syze","Perzgjedhje e kuruar e modeleve","Dergese lokale dhe terheqje ne dyqan"]'),
  ('home.service_highlights', '["Ndrrim baterie","Ndrrim rripi dhe rregullim byzylyku","Diagnostikim i mekanizmit","Rregullim dhe pershtatje e syzeve"]'),
  ('store.address', 'Rruga e Qytetit, Gjilan 60000, Kosovo'),
  ('store.hours', 'Hene - Shtune, 09:00 - 19:00'),
  ('store.phone', '+383 44 000 000'),
  ('store.email', 'info@beril.store'),
  ('store.whatsapp', '+383 44 000 000'),
  ('store.map_url', 'https://www.google.com/maps/search/?api=1&query=Gjilan+Kosovo'),
  ('seo.default_title', 'BERIL | Ora dhe Syze ne Gjilan'),
  ('seo.default_description', 'Ora te kuruara, syze te rafinuara dhe servis i besuar ne Gjilan.'),
  ('seo.default_image', '/placeholders/product-default.svg'),
  ('commerce.delivery_fee_home', '3.00')
on conflict (key) do update set
  value = excluded.value;

insert into public.products (
  slug,
  title,
  brand,
  category,
  subtype,
  short_description,
  description,
  price,
  currency,
  stock_status,
  quantity,
  featured,
  is_new,
  status,
  primary_cta_mode
)
values
  ('seiko-presage-srpb41', 'Presage SRPB41', 'Seiko', 'watch', 'analog_watch', 'Classic automatic dress watch with deep blue dial.', 'A balanced automatic model with elegant proportions for daily and formal wear.', 469, 'EUR', 'in_stock', 5, true, true, 'active', 'add_to_cart'),
  ('tissot-prx-quartz-40', 'PRX Quartz 40', 'Tissot', 'watch', 'analog_watch', 'Integrated bracelet icon with precise quartz movement.', 'A modern classic with clean geometry and strong everyday wear resistance.', 395, 'EUR', 'in_stock', 4, true, false, 'active', 'add_to_cart'),
  ('citizen-eco-drive-bm7108', 'Eco-Drive BM7108', 'Citizen', 'watch', 'analog_watch', 'Solar-powered precision with understated styling.', 'A clean watch powered by light, built for low maintenance and reliable timekeeping.', 289, 'EUR', 'limited', 2, true, false, 'active', 'add_to_cart'),
  ('orient-bambino-v7', 'Bambino V7', 'Orient', 'watch', 'analog_watch', 'Refined automatic dress watch with domed crystal.', 'A classic profile for formal settings with dependable in-house automatic movement.', 259, 'EUR', 'in_stock', 6, false, false, 'active', 'add_to_cart'),
  ('casio-edifice-efv-100', 'Edifice EFV-100', 'Casio', 'watch', 'analog_watch', 'Sporty quartz watch with clean chronograph-inspired profile.', 'A practical everyday watch focused on legibility, comfort, and reliability.', 129, 'EUR', 'in_stock', 8, false, true, 'active', 'add_to_cart'),
  ('hamilton-khaki-field-auto', 'Khaki Field Auto', 'Hamilton', 'watch', 'analog_watch', 'Field watch design with Swiss automatic movement.', 'A robust yet refined model with strong legibility and day-to-day versatility.', 739, 'EUR', 'available_on_request', null, true, false, 'active', 'request_availability'),
  ('longines-conquest-39', 'Conquest 39', 'Longines', 'watch', 'analog_watch', 'Premium Swiss profile for modern daily wear.', 'A contemporary sports-luxury silhouette with high finishing and precise movement.', 1640, 'EUR', 'available_on_request', null, true, false, 'active', 'whatsapp_inquiry'),
  ('mondaine-classic-36', 'Classic 36', 'Mondaine', 'watch', 'analog_watch', 'Minimal Swiss-inspired dial with clean everyday lines.', 'A design-driven model for understated style with dependable quartz precision.', 229, 'EUR', 'in_stock', 3, false, false, 'active', 'add_to_cart'),
  ('ray-ban-rx7140', 'RX7140', 'Ray-Ban', 'eyewear', 'frame', 'Lightweight optical frame with modern square profile.', 'A clean silhouette for daily wear with strong comfort and versatile fit.', 169, 'EUR', 'in_stock', 7, true, true, 'active', 'add_to_cart'),
  ('persol-po3092v', 'PO3092V', 'Persol', 'eyewear', 'frame', 'Italian acetate frame with refined keyhole bridge.', 'A premium frame with subtle character and enduring build quality.', 259, 'EUR', 'limited', 2, true, false, 'active', 'add_to_cart'),
  ('oakley-holbrook', 'Holbrook', 'Oakley', 'eyewear', 'sunglasses', 'Durable performance-inspired sunglasses with clean lines.', 'Strong daily sunglasses profile with lightweight comfort and lens clarity.', 189, 'EUR', 'in_stock', 6, true, false, 'active', 'add_to_cart'),
  ('vogue-vo5230', 'VO5230', 'Vogue', 'eyewear', 'frame', 'Elegant cat-eye optical frame for everyday styling.', 'A balanced feminine silhouette with comfortable fit and refined detailing.', 119, 'EUR', 'in_stock', 5, false, true, 'active', 'add_to_cart'),
  ('tom-ford-ft5694', 'FT5694', 'Tom Ford', 'eyewear', 'frame', 'Premium acetate frame with signature bridge line.', 'A high-end optical frame with clean architectural shaping and strong finish.', 349, 'EUR', 'available_on_request', null, true, false, 'active', 'whatsapp_inquiry'),
  ('polaroid-pld-4065s', 'PLD 4065/S', 'Polaroid', 'eyewear', 'sunglasses', 'Polarized sunglasses with practical lightweight frame.', 'An easy-wear sunglasses option with dependable polarized lens performance.', 89, 'EUR', 'in_stock', 10, false, false, 'active', 'add_to_cart'),
  ('emporio-armani-ea1105', 'EA1105', 'Emporio Armani', 'eyewear', 'frame', 'Slim metal frame with contemporary understated look.', 'A precise frame profile suitable for business and everyday wear.', 149, 'EUR', 'limited', 1, false, false, 'active', 'add_to_cart'),
  ('guess-gu00123', 'GU00123', 'Guess', 'eyewear', 'sunglasses', 'Fashion-forward sunglasses with soft geometric lines.', 'A character-led sunglasses profile designed for expressive daily styling.', 109, 'EUR', 'in_stock', 9, true, true, 'active', 'add_to_cart')
on conflict (slug) do update set
  title = excluded.title,
  brand = excluded.brand,
  category = excluded.category,
  subtype = excluded.subtype,
  short_description = excluded.short_description,
  description = excluded.description,
  price = excluded.price,
  stock_status = excluded.stock_status,
  quantity = excluded.quantity,
  featured = excluded.featured,
  is_new = excluded.is_new,
  status = excluded.status,
  primary_cta_mode = excluded.primary_cta_mode;

insert into public.product_images (product_id, url, alt, sort_order)
select p.id, '/placeholders/product-default.svg', p.title || ' product image', 1
from public.products p
where p.slug in (
  'seiko-presage-srpb41',
  'tissot-prx-quartz-40',
  'citizen-eco-drive-bm7108',
  'orient-bambino-v7',
  'casio-edifice-efv-100',
  'hamilton-khaki-field-auto',
  'longines-conquest-39',
  'mondaine-classic-36',
  'ray-ban-rx7140',
  'persol-po3092v',
  'oakley-holbrook',
  'vogue-vo5230',
  'tom-ford-ft5694',
  'polaroid-pld-4065s',
  'emporio-armani-ea1105',
  'guess-gu00123'
)
on conflict (product_id, sort_order) do update set
  url = excluded.url,
  alt = excluded.alt;

delete from public.product_specs
where product_id in (
  select id from public.products where slug in (
    'seiko-presage-srpb41',
    'tissot-prx-quartz-40',
    'citizen-eco-drive-bm7108',
    'orient-bambino-v7',
    'casio-edifice-efv-100',
    'hamilton-khaki-field-auto',
    'longines-conquest-39',
    'mondaine-classic-36',
    'ray-ban-rx7140',
    'persol-po3092v',
    'oakley-holbrook',
    'vogue-vo5230',
    'tom-ford-ft5694',
    'polaroid-pld-4065s',
    'emporio-armani-ea1105',
    'guess-gu00123'
  )
);

insert into public.product_specs (product_id, key, value, sort_order)
values
  ((select id from public.products where slug = 'seiko-presage-srpb41'), 'movement', 'Automatic', 1),
  ((select id from public.products where slug = 'seiko-presage-srpb41'), 'strap', 'Leather', 2),
  ((select id from public.products where slug = 'seiko-presage-srpb41'), 'dial_color', 'Blue', 3),
  ((select id from public.products where slug = 'seiko-presage-srpb41'), 'case_size', '40.5mm', 4),
  ((select id from public.products where slug = 'tissot-prx-quartz-40'), 'movement', 'Quartz', 1),
  ((select id from public.products where slug = 'tissot-prx-quartz-40'), 'strap', 'Bracelet', 2),
  ((select id from public.products where slug = 'tissot-prx-quartz-40'), 'dial_color', 'Silver', 3),
  ((select id from public.products where slug = 'tissot-prx-quartz-40'), 'case_size', '40mm', 4),
  ((select id from public.products where slug = 'citizen-eco-drive-bm7108'), 'movement', 'Eco-Drive', 1),
  ((select id from public.products where slug = 'citizen-eco-drive-bm7108'), 'strap', 'Leather', 2),
  ((select id from public.products where slug = 'citizen-eco-drive-bm7108'), 'dial_color', 'White', 3),
  ((select id from public.products where slug = 'citizen-eco-drive-bm7108'), 'case_size', '41mm', 4),
  ((select id from public.products where slug = 'orient-bambino-v7'), 'movement', 'Automatic', 1),
  ((select id from public.products where slug = 'orient-bambino-v7'), 'strap', 'Leather', 2),
  ((select id from public.products where slug = 'orient-bambino-v7'), 'dial_color', 'Cream', 3),
  ((select id from public.products where slug = 'orient-bambino-v7'), 'case_size', '40mm', 4),
  ((select id from public.products where slug = 'casio-edifice-efv-100'), 'movement', 'Quartz', 1),
  ((select id from public.products where slug = 'casio-edifice-efv-100'), 'strap', 'Bracelet', 2),
  ((select id from public.products where slug = 'casio-edifice-efv-100'), 'dial_color', 'Black', 3),
  ((select id from public.products where slug = 'casio-edifice-efv-100'), 'case_size', '42mm', 4),
  ((select id from public.products where slug = 'hamilton-khaki-field-auto'), 'movement', 'Automatic', 1),
  ((select id from public.products where slug = 'hamilton-khaki-field-auto'), 'strap', 'Textile', 2),
  ((select id from public.products where slug = 'hamilton-khaki-field-auto'), 'dial_color', 'Green', 3),
  ((select id from public.products where slug = 'hamilton-khaki-field-auto'), 'case_size', '38mm', 4),
  ((select id from public.products where slug = 'longines-conquest-39'), 'movement', 'Automatic', 1),
  ((select id from public.products where slug = 'longines-conquest-39'), 'strap', 'Bracelet', 2),
  ((select id from public.products where slug = 'longines-conquest-39'), 'dial_color', 'Blue', 3),
  ((select id from public.products where slug = 'longines-conquest-39'), 'case_size', '39mm', 4),
  ((select id from public.products where slug = 'mondaine-classic-36'), 'movement', 'Quartz', 1),
  ((select id from public.products where slug = 'mondaine-classic-36'), 'strap', 'Leather', 2),
  ((select id from public.products where slug = 'mondaine-classic-36'), 'dial_color', 'White', 3),
  ((select id from public.products where slug = 'mondaine-classic-36'), 'case_size', '36mm', 4),
  ((select id from public.products where slug = 'ray-ban-rx7140'), 'frame_type', 'Frames', 1),
  ((select id from public.products where slug = 'ray-ban-rx7140'), 'shape', 'Square', 2),
  ((select id from public.products where slug = 'ray-ban-rx7140'), 'material', 'Acetate', 3),
  ((select id from public.products where slug = 'ray-ban-rx7140'), 'color', 'Black', 4),
  ((select id from public.products where slug = 'ray-ban-rx7140'), 'gender', 'Unisex', 5),
  ((select id from public.products where slug = 'persol-po3092v'), 'frame_type', 'Frames', 1),
  ((select id from public.products where slug = 'persol-po3092v'), 'shape', 'Round', 2),
  ((select id from public.products where slug = 'persol-po3092v'), 'material', 'Acetate', 3),
  ((select id from public.products where slug = 'persol-po3092v'), 'color', 'Havana', 4),
  ((select id from public.products where slug = 'persol-po3092v'), 'gender', 'Unisex', 5),
  ((select id from public.products where slug = 'oakley-holbrook'), 'frame_type', 'Sunglasses', 1),
  ((select id from public.products where slug = 'oakley-holbrook'), 'shape', 'Square', 2),
  ((select id from public.products where slug = 'oakley-holbrook'), 'material', 'Injected', 3),
  ((select id from public.products where slug = 'oakley-holbrook'), 'color', 'Matte Black', 4),
  ((select id from public.products where slug = 'oakley-holbrook'), 'gender', 'Unisex', 5),
  ((select id from public.products where slug = 'vogue-vo5230'), 'frame_type', 'Frames', 1),
  ((select id from public.products where slug = 'vogue-vo5230'), 'shape', 'Cat Eye', 2),
  ((select id from public.products where slug = 'vogue-vo5230'), 'material', 'Acetate', 3),
  ((select id from public.products where slug = 'vogue-vo5230'), 'color', 'Brown', 4),
  ((select id from public.products where slug = 'vogue-vo5230'), 'gender', 'Women', 5),
  ((select id from public.products where slug = 'tom-ford-ft5694'), 'frame_type', 'Frames', 1),
  ((select id from public.products where slug = 'tom-ford-ft5694'), 'shape', 'Rectangular', 2),
  ((select id from public.products where slug = 'tom-ford-ft5694'), 'material', 'Acetate', 3),
  ((select id from public.products where slug = 'tom-ford-ft5694'), 'color', 'Black', 4),
  ((select id from public.products where slug = 'tom-ford-ft5694'), 'gender', 'Unisex', 5),
  ((select id from public.products where slug = 'polaroid-pld-4065s'), 'frame_type', 'Sunglasses', 1),
  ((select id from public.products where slug = 'polaroid-pld-4065s'), 'shape', 'Round', 2),
  ((select id from public.products where slug = 'polaroid-pld-4065s'), 'material', 'Metal', 3),
  ((select id from public.products where slug = 'polaroid-pld-4065s'), 'color', 'Gold', 4),
  ((select id from public.products where slug = 'polaroid-pld-4065s'), 'gender', 'Unisex', 5),
  ((select id from public.products where slug = 'emporio-armani-ea1105'), 'frame_type', 'Frames', 1),
  ((select id from public.products where slug = 'emporio-armani-ea1105'), 'shape', 'Rectangular', 2),
  ((select id from public.products where slug = 'emporio-armani-ea1105'), 'material', 'Metal', 3),
  ((select id from public.products where slug = 'emporio-armani-ea1105'), 'color', 'Gunmetal', 4),
  ((select id from public.products where slug = 'emporio-armani-ea1105'), 'gender', 'Men', 5),
  ((select id from public.products where slug = 'guess-gu00123'), 'frame_type', 'Sunglasses', 1),
  ((select id from public.products where slug = 'guess-gu00123'), 'shape', 'Geometric', 2),
  ((select id from public.products where slug = 'guess-gu00123'), 'material', 'Injected', 3),
  ((select id from public.products where slug = 'guess-gu00123'), 'color', 'Tortoise', 4),
  ((select id from public.products where slug = 'guess-gu00123'), 'gender', 'Women', 5);

insert into public.journal_posts (slug, title, excerpt, content, status, published_at)
values
  ('si-te-zgjidhni-nje-ore', 'Si te zgjidhni nje ore', 'Udhezues i shkurter per zgjedhjen e ores sipas stilit dhe perdorimit.', 'Permbajtja e artikullit do te pasurohet ne fazen e content-it.', 'published', timezone('utc', now())),
  ('kur-nderrohet-bateria', 'Kur nderrohet bateria e ores', 'Shenjat praktike qe tregojne se bateria duhet nderruar.', 'Permbajtja e artikullit do te pasurohet ne fazen e content-it.', 'published', timezone('utc', now())),
  ('kujdesi-baze-per-syzet', 'Kujdesi baze per syzet', 'Keshilla te shpejta per mirembajtjen e syzeve ne perdorim ditor.', 'Permbajtja e artikullit do te pasurohet ne fazen e content-it.', 'draft', null)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.loyalty_rules (name, points_per_eur, min_redeem_points, reward_type, active)
select 'BERIL Standard Loyalty', 1.0000, 100, 'points', true
where not exists (
  select 1 from public.loyalty_rules where name = 'BERIL Standard Loyalty'
);

insert into public.campaigns (name, slug, description, status, starts_at, ends_at, budget)
values (
  'Pranvere 2026',
  'pranvere-2026',
  'Oferta sezonale per ora dhe syze.',
  'active',
  timezone('utc', now()) - interval '3 day',
  timezone('utc', now()) + interval '45 day',
  1200
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  budget = excluded.budget;

insert into public.promotions (
  campaign_id,
  name,
  status,
  type,
  scope,
  percentage_off,
  amount_off,
  min_order_total,
  is_stackable,
  starts_at,
  ends_at
)
select
  c.id,
  'Ulje 10% Checkout',
  'active',
  'percentage',
  'order',
  10,
  null,
  100,
  false,
  timezone('utc', now()) - interval '3 day',
  timezone('utc', now()) + interval '45 day'
from public.campaigns c
where c.slug = 'pranvere-2026'
  and not exists (
    select 1 from public.promotions p where p.name = 'Ulje 10% Checkout'
  );

insert into public.coupon_codes (
  promotion_id,
  code,
  status,
  usage_limit,
  per_customer_limit,
  starts_at,
  ends_at
)
select
  p.id,
  'BERIL10',
  'active',
  1000,
  1,
  timezone('utc', now()) - interval '3 day',
  timezone('utc', now()) + interval '45 day'
from public.promotions p
where p.name = 'Ulje 10% Checkout'
on conflict (code) do update set
  promotion_id = excluded.promotion_id,
  status = excluded.status,
  usage_limit = excluded.usage_limit,
  per_customer_limit = excluded.per_customer_limit,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at;

insert into public.notification_templates (key, title, channel, trigger, body, is_active)
values
  (
    'order_created_email_sq',
    'Order Created Email (SQ)',
    'email',
    'order_created',
    'Pershendetje {{name}}, porosia juaj {{orderCode}} u pranua. Totali: {{total}} EUR.',
    true
  ),
  (
    'repair_created_email_sq',
    'Repair Created Email (SQ)',
    'email',
    'repair_created',
    'Pershendetje {{name}}, kerkesa e servisimit {{repairCode}} u regjistrua me sukses.',
    true
  )
on conflict (key) do update set
  title = excluded.title,
  channel = excluded.channel,
  trigger = excluded.trigger,
  body = excluded.body,
  is_active = excluded.is_active;

insert into public.suppliers (name, contact_name, email, phone, notes)
values
  (
    'Euro Time Parts',
    'Arben K.',
    'parts@eurotime.example',
    '+38344000111',
    'Supplier i pjeseve dhe baterive per ore.'
  )
on conflict (name) do update set
  contact_name = excluded.contact_name,
  email = excluded.email,
  phone = excluded.phone,
  notes = excluded.notes;

insert into public.affiliates (name, email, code, status, commission_rate, notes)
values
  (
    'Local Creator One',
    'creator1@beril.example',
    'BERIL-A1',
    'active',
    0.0500,
    'Affiliate test account'
  )
on conflict (code) do update set
  name = excluded.name,
  email = excluded.email,
  status = excluded.status,
  commission_rate = excluded.commission_rate,
  notes = excluded.notes;
