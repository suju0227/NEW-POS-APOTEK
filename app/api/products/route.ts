import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { product } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  const rows = await db.select().from(product).orderBy(asc(product.name))
  return NextResponse.json(rows)
}
