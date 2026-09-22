export type ProductStatus = 'available' | 'low-stock' | 'unavailable' | 'expired'

export type Product = {
  id: string
  name: string
  genericName: string
  strength: string
  unitLabel: string
  barcode: string
  price: number
  availableStock: number
  status: ProductStatus
  requiresPrescription?: boolean
}

export type CartLine = {
  product: Product
  quantity: number
  allocations: { batch: string; expiry: string; quantity: number }[]
}

export type PaymentMethod = 'cash' | 'qris'

export type PaymentState = 'idle' | 'cash' | 'qris' | 'processing' | 'success'

export const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
