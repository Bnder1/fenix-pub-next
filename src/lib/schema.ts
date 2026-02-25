import {
  pgTable, serial, varchar, text, numeric, integer,
  boolean, json, timestamp, index, unique,
} from 'drizzle-orm/pg-core';

// ─── Products ────────────────────────────────────────────────────────────────
export const products = pgTable('products', {
  id:                  serial('id').primaryKey(),
  ref:                 varchar('ref', { length: 100 }).notNull().unique(),
  name:                varchar('name', { length: 255 }).notNull(),
  description:         text('description'),
  longDescription:     text('long_description'),
  category:            varchar('category', { length: 100 }),
  price:               numeric('price', { precision: 10, scale: 2 }),
  moq:                 integer('moq').default(1),
  material:            varchar('material', { length: 255 }),
  dimensions:          varchar('dimensions', { length: 255 }),
  weight:              numeric('weight', { precision: 10, scale: 3 }),
  countryOfOrigin:     varchar('country_of_origin', { length: 10 }),
  hsCode:              varchar('hs_code', { length: 20 }),
  image:               text('image'),
  images:              json('images').$type<string[]>().default([]),
  variants:            json('variants').$type<Variant[]>().default([]),
  sizes:               json('sizes').$type<string[]>().default([]),
  colors:              text('colors'),
  printTechniques:     text('print_techniques'),
  printable:           boolean('printable').default(false),
  markingPositions:    json('marking_positions').$type<string[]>().default([]),
  markingTechniqueIds: json('marking_technique_ids').$type<number[]>().default([]),
  packaging:           json('packaging').$type<Record<string, unknown>>(),
  meta:                json('meta').$type<Record<string, unknown>>(),
  source:              varchar('source', { length: 50 }).default('manual'),
  active:              boolean('active').default(true),
  createdAt:           timestamp('created_at').defaultNow(),
  updatedAt:           timestamp('updated_at').defaultNow(),
}, (t) => [
  index('products_category_idx').on(t.category),
  index('products_active_idx').on(t.active),
]);

// ─── Categories ──────────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
  id:          serial('id').primaryKey(),
  name:        varchar('name', { length: 100 }).notNull().unique(),
  slug:        varchar('slug', { length: 120 }).notNull().unique(),
  icon:        varchar('icon', { length: 10 }).default('🗂️'),
  description: text('description'),
  fromPrice:   varchar('from_price', { length: 50 }),
  sortOrder:   integer('sort_order').default(0),
  active:      boolean('active').default(true),
  createdAt:   timestamp('created_at').defaultNow(),
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 150 }).notNull(),
  email:     varchar('email', { length: 255 }).notNull().unique(),
  password:  varchar('password', { length: 255 }).notNull(),
  company:   varchar('company', { length: 150 }),
  phone:     varchar('phone', { length: 30 }),
  role:      varchar('role', { length: 20 }).default('client'),
  active:    boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Favorites ───────────────────────────────────────────────────────────────
export const favorites = pgTable('favorites', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [unique('favorites_user_product_unique').on(t.userId, t.productId)]);

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartItems = pgTable('cart_items', {
  id:                 serial('id').primaryKey(),
  userId:             integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId:          integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  qty:                integer('qty').notNull().default(1),
  size:               varchar('size', { length: 20 }),
  color:              varchar('color', { length: 100 }),
  markingTechniqueId: integer('marking_technique_id'),
  markingPosition:    varchar('marking_position', { length: 150 }),
  designNotes:        text('design_notes'),
  designFile:         text('design_file'),   // base64 data URL or external URL
  createdAt:          timestamp('created_at').defaultNow(),
  updatedAt:          timestamp('updated_at').defaultNow(),
});

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orders = pgTable('orders', {
  id:              serial('id').primaryKey(),
  orderNumber:     varchar('order_number', { length: 30 }).unique(),
  userId:          integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  status:          varchar('status', { length: 50 }).default('pending'),
  total:           numeric('total', { precision: 10, scale: 2 }),
  notes:           text('notes'),
  adminNotes:      text('admin_notes'),
  batStatus:       varchar('bat_status', { length: 20 }), // null | 'pending' | 'approved' | 'refused'
  shippingName:    varchar('shipping_name', { length: 150 }),
  shippingEmail:   varchar('shipping_email', { length: 255 }),
  shippingPhone:   varchar('shipping_phone', { length: 30 }),
  shippingCompany: varchar('shipping_company', { length: 150 }),
  shippingAddress: text('shipping_address'),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id:                   serial('id').primaryKey(),
  orderId:              integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId:            integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  productRef:           varchar('product_ref', { length: 100 }),
  productName:          varchar('product_name', { length: 255 }),
  qty:                  integer('qty').notNull(),
  size:                 varchar('size', { length: 20 }),
  color:                varchar('color', { length: 100 }),
  unitPrice:            numeric('unit_price', { precision: 10, scale: 2 }),
  markingTechniqueId:   integer('marking_technique_id'),
  markingTechniqueName: varchar('marking_technique_name', { length: 100 }),
  markingPosition:      varchar('marking_position', { length: 150 }),
  markingUnitPrice:     numeric('marking_unit_price', { precision: 10, scale: 2 }),
  markingSetupFee:      numeric('marking_setup_fee',  { precision: 10, scale: 2 }),
  designNotes:          text('design_notes'),
  designFile:           text('design_file'),
});

// ─── Contact Messages ─────────────────────────────────────────────────────────
export const contactMessages = pgTable('contact_messages', {
  id:         serial('id').primaryKey(),
  userId:     integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  name:       varchar('name', { length: 150 }).notNull(),
  email:      varchar('email', { length: 255 }).notNull(),
  company:    varchar('company', { length: 150 }),
  phone:      varchar('phone', { length: 30 }),
  subject:    varchar('subject', { length: 255 }),
  message:    text('message').notNull(),
  productRef: varchar('product_ref', { length: 100 }),
  status:     varchar('status', { length: 30 }).default('nouveau'),
  notes:      text('notes'),
  readAt:     timestamp('read_at'),
  createdAt:  timestamp('created_at').defaultNow(),
});

// ─── Testimonials ─────────────────────────────────────────────────────────────
export const testimonials = pgTable('testimonials', {
  id:        serial('id').primaryKey(),
  text:      text('text').notNull(),
  name:      varchar('name', { length: 100 }).notNull(),
  company:   varchar('company', { length: 150 }),
  initials:  varchar('initials', { length: 5 }),
  rating:    integer('rating').default(5),
  sortOrder: integer('sort_order').default(0),
  active:    boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Documents ────────────────────────────────────────────────────────────────
export const documents = pgTable('documents', {
  id:          serial('id').primaryKey(),
  title:       varchar('title', { length: 255 }).notNull(),
  filename:    varchar('filename', { length: 255 }),
  url:         text('url'),
  description: text('description'),
  active:      boolean('active').default(true),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});

// ─── CMS Pages ────────────────────────────────────────────────────────────────
export const cmsPages = pgTable('cms_pages', {
  id:        serial('id').primaryKey(),
  slug:      varchar('slug', { length: 120 }).notNull().unique(),
  title:     varchar('title', { length: 255 }).notNull(),
  content:   text('content'),
  metaDesc:  varchar('meta_description', { length: 300 }),
  published: boolean('published').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settings = pgTable('settings', {
  id:    serial('id').primaryKey(),
  key:   varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
});

// ─── Marking Techniques ───────────────────────────────────────────────────────
export const markingTechniques = pgTable('marking_techniques', {
  id:          serial('id').primaryKey(),
  name:        varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  unitPrice:   numeric('unit_price', { precision: 10, scale: 2 }).default('0'),
  setupFee:    numeric('setup_fee',  { precision: 10, scale: 2 }).default('0'),
  active:      boolean('active').default(true),
  sortOrder:   integer('sort_order').default(0),
  createdAt:   timestamp('created_at').defaultNow(),
});

// ─── Order Exchanges (BAT + messages) ─────────────────────────────────────────
export const orderExchanges = pgTable('order_exchanges', {
  id:             serial('id').primaryKey(),
  orderId:        integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  senderType:     varchar('sender_type', { length: 10 }).notNull(), // 'admin' | 'client'
  userId:         integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  message:        text('message').notNull(),
  isBat:          boolean('is_bat').notNull().default(false),
  batFilename:    varchar('bat_filename', { length: 255 }),
  batUrl:         varchar('bat_url',      { length: 500 }),
  batStatus:      varchar('bat_status',   { length: 20 }), // 'pending' | 'approved' | 'refused'
  clientActionAt: timestamp('client_action_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type Variant = {
  color:       string;
  color_code?: string;
  pms_color?:  string;
  sku?:        string;
  gtin?:       string;
  status?:     string;
  image?:      string;   // image principale (front) de la couleur
  images?:     string[]; // toutes les images de cette couleur
  sizes?:      string[]; // tailles disponibles pour cette couleur (S, M, L, XL…)
};

export type Product          = typeof products.$inferSelect;
export type User             = typeof users.$inferSelect;
export type Order            = typeof orders.$inferSelect;
export type CmsPage          = typeof cmsPages.$inferSelect;
export type ContactMessage   = typeof contactMessages.$inferSelect;
export type Testimonial      = typeof testimonials.$inferSelect;
export type Document         = typeof documents.$inferSelect;
export type MarkingTechnique = typeof markingTechniques.$inferSelect;
export type OrderExchange    = typeof orderExchanges.$inferSelect;
