'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { product, sale, saleItem } from '@/lib/db/schema'
import { eq, inArray, sql } from 'drizzle-orm'

export async function completeSale(input: { paymentMethod: 'cash' | 'qris'; lines: { productId: string; quantity: number }[] }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  if (!input.lines.length || !['cash', 'qris'].includes(input.paymentMethod)) throw new Error('Invalid checkout')
  if (input.lines.some((line) => !line.productId || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 999)) throw new Error('Invalid quantity')

  return db.transaction(async (tx) => {
    const quantities = new Map<string, number>()
    for (const line of input.lines) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity)
    const ids = [...quantities.keys()]
    const rows = await tx.select().from(product).where(inArray(product.id, ids))
    if (rows.length !== ids.length) throw new Error('Product unavailable')

    const items = ids.map((productId) => {
      const row = rows.find((item) => item.id === productId)
      const quantity = quantities.get(productId) ?? 0
      if (!row || row.status === 'unavailable' || row.status === 'expired' || row.availableStock < quantity) throw new Error('Stock changed')
      return { row, quantity, lineTotal: row.price * quantity }
    })
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const saleId = crypto.randomUUID()
    await tx.insert(sale).values({ id: saleId, userId: session.user.id, paymentMethod: input.paymentMethod, subtotal: total, total })
    for (const item of items) {
      await tx.insert(saleItem).values({ id: crypto.randomUUID(), saleId, productId: item.row.id, quantity: item.quantity, unitPrice: item.row.price, lineTotal: item.lineTotal })
      const updated = await tx.update(product).set({ availableStock: sql`${product.availableStock} - ${item.quantity}`, updatedAt: new Date() }).where(eq(product.id, item.row.id)).returning({ stock: product.availableStock })
      if (!updated[0] || updated[0].stock < 0) throw new Error('Stock changed')
    }
    return { saleId, total }
  })
}
