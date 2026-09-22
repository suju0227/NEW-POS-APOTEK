import type { Product } from './pos-types'

export const demoProducts: Product[] = [
  { id: 'amox', name: 'Amoxicillin 500 mg', genericName: 'Amoxicillin', strength: '500 mg', unitLabel: 'Strip', barcode: '899123456001', price: 18500, availableStock: 24, status: 'available', requiresPrescription: true },
  { id: 'para', name: 'Paracetamol 500 mg', genericName: 'Paracetamol', strength: '500 mg', unitLabel: 'Strip', barcode: '899123456002', price: 8500, availableStock: 68, status: 'available' },
  { id: 'omep', name: 'Omeprazole 20 mg', genericName: 'Omeprazole', strength: '20 mg', unitLabel: 'Strip', barcode: '899123456003', price: 12500, availableStock: 8, status: 'low-stock' },
  { id: 'cetir', name: 'Cetirizine 10 mg', genericName: 'Cetirizine', strength: '10 mg', unitLabel: 'Strip', barcode: '899123456004', price: 11000, availableStock: 0, status: 'unavailable' },
  { id: 'vitc', name: 'Vitamin C 500 mg', genericName: 'Ascorbic Acid', strength: '500 mg', unitLabel: 'Botol', barcode: '899123456005', price: 26500, availableStock: 17, status: 'available' },
  { id: 'antacid', name: 'Antasida Doen', genericName: 'Aluminium Hydroxide', strength: '60 ml', unitLabel: 'Botol', barcode: '899123456006', price: 9500, availableStock: 31, status: 'available' },
]

export const batchAllocations = (productId: string, quantity: number) => {
  const product = demoProducts.find((item) => item.id === productId)
  if (!product) return []
  const first = Math.min(quantity, product.id === 'omep' ? 3 : quantity)
  return [
    { batch: product.id === 'omep' ? 'OM2403A' : 'BTH-2407-01', expiry: product.id === 'omep' ? '12 Sep 2026' : '30 Nov 2026', quantity: first },
    ...(first < quantity ? [{ batch: 'BTH-2408-04', expiry: '18 Feb 2027', quantity: quantity - first }] : []),
  ]
}
