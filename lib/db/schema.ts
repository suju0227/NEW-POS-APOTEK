import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(), createdAt: timestamp('createdAt').notNull(), updatedAt: timestamp('updatedAt').notNull(), ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), userId: text('userId').notNull(), accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'), scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt').notNull(), updatedAt: timestamp('updatedAt').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(), createdAt: timestamp('createdAt'), updatedAt: timestamp('updatedAt'),
})

export const product = pgTable('product', {
  id: text('id').primaryKey(), name: text('name').notNull(), genericName: text('genericName').notNull(), barcode: text('barcode').notNull().unique(), unitLabel: text('unitLabel').notNull(), price: integer('price').notNull(), availableStock: integer('availableStock').notNull().default(0), requiresPrescription: boolean('requiresPrescription').notNull().default(false), status: text('status').notNull().default('available'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const sale = pgTable('sale', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), paymentMethod: text('paymentMethod').notNull(), subtotal: integer('subtotal').notNull(), total: integer('total').notNull(), createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const saleItem = pgTable('sale_item', {
  id: text('id').primaryKey(), saleId: text('saleId').notNull(), productId: text('productId').notNull(), quantity: integer('quantity').notNull(), unitPrice: integer('unitPrice').notNull(), lineTotal: integer('lineTotal').notNull(),
})

type ProductRow = typeof product.$inferSelect
export type { ProductRow }
export const authSchema = { user, session, account, verification }
export const appSchema = { product, sale, saleItem }
