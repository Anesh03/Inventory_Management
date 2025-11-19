export interface Product {
  sku: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  reorderLevel: number;
  supplierId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  openingBalance: number;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  creditLimit: number;
}

export interface TransactionItem {
  sku: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Transaction {
  id: string;
  date: string;
  entityId: string; // Supplier ID, Customer ID, or 'ADJUSTMENT'
  entityName: string;
  invoiceNo: string;
  items: TransactionItem[];
  totalAmount: number;
  notes?: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
}

export interface InventoryStats {
  totalProducts: number;
  totalStockValue: number;
  totalQuantity: number;
  lowStockCount: number;
}

export interface ProductStock {
  sku: string;
  currentStock: number;
  stockValue: number;
}