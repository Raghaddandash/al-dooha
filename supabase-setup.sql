-- Run this whole file once in Supabase: Project > SQL Editor > New query > paste > Run

-- 1. Tables --------------------------------------------------------------

create table categories (
  id text primary key,
  name_en text not null,
  name_ar text not null,
  sort_order int default 0
);

create table menu_items (
  id bigserial primary key,
  category_id text references categories(id) on delete cascade,
  name_en text not null,
  name_ar text,
  desc_en text,
  desc_ar text,
  price numeric not null,
  remove_options jsonb default '[]'::jsonb,  -- e.g. [{"en":"Sugar","ar":"سكر"}]
  extra_options jsonb default '[]'::jsonb    -- e.g. [{"name_en":"Cheese","name_ar":"جبنة","price":25000}]
);

create table orders (
  id bigserial primary key,
  created_at timestamptz default now(),
  items jsonb not null,
  total numeric not null,
  status text default 'new'
);

-- 2. Security (Row Level Security) ---------------------------------------
-- Customers use the public "anon" key: they may read the menu and create
-- orders, but may NOT read other people's orders or edit the menu.
-- Only a logged-in admin (Supabase Auth) can read orders and manage the menu.

alter table categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;

create policy "public can read categories" on categories
  for select using (true);

create policy "public can read menu_items" on menu_items
  for select using (true);

create policy "admin can manage menu_items" on menu_items
  for all using (auth.role() = 'authenticated');

create policy "admin can manage categories" on categories
  for all using (auth.role() = 'authenticated');

create policy "anyone can create an order" on orders
  for insert with check (true);

create policy "admin can read orders" on orders
  for select using (auth.role() = 'authenticated');

create policy "admin can update orders" on orders
  for update using (auth.role() = 'authenticated');

-- 3. Seed data ------------------------------------------------------------

insert into categories (id, name_en, name_ar, sort_order) values
  ('hot', 'Hot Drinks', 'مشروبات ساخنة', 1),
  ('cold', 'Cold Drinks', 'مشروبات باردة', 2),
  ('breakfast', 'Breakfast', 'فطور', 3),
  ('sandwiches', 'Sandwiches', 'ساندويش', 4),
  ('sweets', 'Sweets', 'حلويات', 5);

insert into menu_items (category_id, name_en, name_ar, desc_en, desc_ar, price, remove_options, extra_options) values
  ('hot', 'Arabic Coffee', 'قهوة عربية', 'Cardamom, lightly roasted', 'هيل، تحميص خفيف', 60000, '[]', '[{"name_en":"Extra shot","name_ar":"شوت زيادة","price":15000}]'),
  ('hot', 'Spanish Latte', 'سبانيش لاتيه', 'Espresso, condensed milk, steamed milk', 'إسبريسو، حليب مكثف، حليب مبخر', 110000, '[{"en":"Sugar","ar":"سكر"}]', '[{"name_en":"Vanilla syrup","name_ar":"شراب فانيلا","price":20000},{"name_en":"Oat milk","name_ar":"حليب شوفان","price":25000}]'),
  ('hot', 'Karak Tea', 'شاي كرك', 'Spiced milk tea', 'شاي بالحليب والبهارات', 70000, '[{"en":"Sugar","ar":"سكر"},{"en":"Cardamom","ar":"هيل"}]', '[]'),
  ('cold', 'Iced Spanish Latte', 'سبانيش لاتيه مثلج', 'Espresso over condensed milk and ice', 'إسبريسو فوق حليب مكثف وثلج', 120000, '[]', '[{"name_en":"Caramel drizzle","name_ar":"كراميل","price":20000}]'),
  ('cold', 'Mango Cooler', 'مانجو كولر', 'Fresh mango, mint, soda', 'مانجو طازج، نعنع، صودا', 130000, '[{"en":"Mint","ar":"نعنع"}]', '[]'),
  ('cold', 'Iced Americano', 'أمريكانو مثلج', 'Double espresso, cold water', 'إسبريسو دبل، ماء بارد', 95000, '[]', '[]'),
  ('breakfast', 'Manoushe Zaatar', 'مناقيش زعتر', 'Za''atar, olive oil, sesame', 'زعتر، زيت زيتون، سمسم', 85000, '[]', '[{"name_en":"Halloumi","name_ar":"حلوم","price":35000},{"name_en":"Extra oil","name_ar":"زيت زيادة","price":10000}]'),
  ('breakfast', 'Labneh Plate', 'صحن لبنة', 'Labneh, olive oil, mint, bread', 'لبنة، زيت زيتون، نعنع، خبز', 95000, '[{"en":"Mint","ar":"نعنع"}]', '[]'),
  ('sandwiches', 'Chicken Shawarma', 'شاورما دجاج', 'Garlic sauce, pickles, fries', 'ثوم، مخلل، بطاطا', 180000, '[{"en":"Pickles","ar":"مخلل"},{"en":"Garlic sauce","ar":"ثوم"},{"en":"Fries","ar":"بطاطا"}]', '[{"name_en":"Extra garlic","name_ar":"ثوم زيادة","price":10000},{"name_en":"Cheese","name_ar":"جبنة","price":25000}]'),
  ('sandwiches', 'Halloumi Sandwich', 'ساندويش حلوم', 'Grilled halloumi, tomato, arugula', 'حلوم مشوي، بندورة، جرجير', 160000, '[{"en":"Tomato","ar":"بندورة"},{"en":"Arugula","ar":"جرجير"}]', '[]'),
  ('sweets', 'Knefeh Slice', 'قطعة كنافة', 'Sweet cheese, semolina crust, syrup', 'جبنة حلوة، قشرة سميد، شيرة', 150000, '[]', '[]'),
  ('sweets', 'Date Maamoul (3pc)', 'معمول تمر (٣ حبات)', 'Semolina cookies, date filling', 'كعك سميد محشي تمر', 120000, '[]', '[]');
