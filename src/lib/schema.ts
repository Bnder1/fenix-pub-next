import {
  pgTable, serial, varchar, text, numeric, integer,
  boolean, json, timestamp, index, unique,
} from 'drizzle-orm/pg-core';

// ─── Products ────────────────────────────────────────────────────────────────
export const products = pgTable('products', {
  id:              serial('id').primaryKey(),
  ref:             varchar('ref', { length: 100 }).notNull().unique(),
  name:            varchar('name', { length: 255 }).notNull(),
  description:     text('description'),
  longDescription: text('long_description'),
  category:        varchar('category', { length: 100 }),
  price:           numeric('price', { precision: 10, scale: 2 }),
  moq:             integer('moq').default(1),
  material:        varchar('material', { length: 255 }),
  dimensions:      varchar('dimensions', { length: 255 }),
  weight:          numeric('weight', { precision: 10, scale: 3 }),
  countryOfOrigin: varchar('country_of_origin', { length: 10 }),
  hsCode:          varchar('hs_code', { length: 20 }),
  image:           text('image'),
  images:          json('images').$type<string[]>().default([]),
  variants:        json('variants').$type<Variant[]>().default([]),
  colors:          text('colors'),
  printTechniques: text('print_techniques'),
  printable:       boolean('printable').default(false),
  packaging:       json('packaging').$type<Record<string, unknown>>(),
  meta:            json('meta').$type<Record<string, unknown>>(),
  source:          varchar('source', { length: 50 }).default('manual'),
  active:          boolean('active').default(true),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow(),
}, (t) => [
  index('products_category_idx').on(t.category),
  index('products_active_idx').on(t.active),
]);

// ─── Categories ──────────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 100 }).notNull().unique(),
  slug:      varchar('slug', { length: 120 }).notNull().unique(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:           serial('id').primaryKey(),
  name:         varchar('name', { length: 150 }).notNull(),
  email:        varchar('email', { length: 255 }).notNull().unique(),
  password:     varchar('password', { length: 255 }).notNull(),
  company:      varchar('company', { length: 150 }),
  phone:        varchar('phone', { length: 30 }),
  role:         varchar('role', { length: 20 }).default('client'),
  active:       boolean('active').default(true),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
});

// ─── Favorites ───────────────────────────────────────────────────────────────
export const favorites = pgTable('favorites', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  unique('favorites_user_product_unique').on(t.userId, t.productId),
]);

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartItems = pgTable('cart_items', {
  id:        serial('id').primaryKey(),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  qty:       integer('qty').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  unique('cart_user_product_unique').on(t.userId, t.productId),
]);

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orders = pgTable('orders', {
  id:         serial('id').primaryKey(),
  userId:     integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  status:     varchar('status', { length: 50 }).default('pending'),
  total:      numeric('total', { precision: 10, scale: 2 }),
  notes:      text('notes'),
  createdAt:  timestamp('created_at').defaultNow(),
  updatedAt:  timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id:         serial('id').primaryKey(),
  orderId:    integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId:  integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  productRef: varchar('product_ref', { length: 100 }),
  productName:varchar('product_name', { length: 255 }),
  qty:        integer('qty').notNull(),
  unitPrice:  numeric('unit_price', { precision: 10, scale: 2 }),
});

// ─── Contact Messages ─────────────────────────────────────────────────────────
export const contactMessages = pgTable('contact_messages', {
  id:        serial('id').primaryKey(),
  name:      varchar('name', { length: 150 }).notNull(),
  email:     varchar('email', { length: 255 }).notNull(),
  company:   varchar('company', { length: 150 }),
  phone:     varchar('phone', { length: 30 }),
  subject:   varchar('subject', { length: 255 }),
  message:   text('message').notNull(),
  productRef:varchar('product_ref', { length: 100 }),
  status:    varchar('status', { length: 30 }).default('nouveau'),
  notes:     text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settings = pgTable('settings', {
  id:    serial('id').primaryKey(),
  key:   varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type Variant = {
  color: string;
  color_code?: string;
  pms_color?: string;
  sku?: string;
  gtin?: string;
  status?: string;
  image?: string;
};

export type Product = typeof products.$inferSelect;
export type User    = typeof users.$inferSelect;
