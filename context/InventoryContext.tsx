import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Supplier, Customer, Transaction, ProductStock } from '../types';

interface InventoryContextType {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  productStocks: Record<string, ProductStock>;
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  addSupplier: (s: Supplier) => void;
  updateSupplier: (s: Supplier) => void;
  addCustomer: (c: Customer) => void;
  updateCustomer: (c: Customer) => void;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  deleteProduct: (sku: string) => void;
  deleteSupplier: (id: string) => void;
  deleteCustomer: (id: string) => void;
  getProductStock: (sku: string) => ProductStock;
  resetData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INITIAL_PRODUCTS: Product[] = [
  { sku: 'PRD001', name: 'Steel Rod 1/2"', category: 'Steel', unit: 'ft', purchasePrice: 200, salePrice: 260, reorderLevel: 50, supplierId: 'SUP001' },
  { sku: 'PRD002', name: 'Cement Bag 50kg', category: 'Cement', unit: 'bag', purchasePrice: 1200, salePrice: 1500, reorderLevel: 30, supplierId: 'SUP002' },
  { sku: 'PRD003', name: 'PVC Pipe 2"', category: 'Plumbing', unit: 'ft', purchasePrice: 950, salePrice: 1200, reorderLevel: 20, supplierId: 'SUP001' },
  { sku: 'PRD004', name: 'Plywood Sheet 18mm', category: 'Wood', unit: 'sheet', purchasePrice: 2500, salePrice: 3200, reorderLevel: 15, supplierId: 'SUP001' },
  { sku: 'PRD005', name: 'White Paint 4L', category: 'Paint', unit: 'can', purchasePrice: 4500, salePrice: 5500, reorderLevel: 10, supplierId: 'SUP002' },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'SUP001', name: 'ABC Build Supplies', contact: 'John Doe', phone: '555-0101', address: '123 Ind. Estate', openingBalance: 0 },
  { id: 'SUP002', name: 'XYZ Cement Works', contact: 'Jane Smith', phone: '555-0102', address: '456 Quarry Rd', openingBalance: 0 },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'CUST001', name: 'BuildIt Construction', contact: 'Mike Ross', phone: '555-0201', address: '789 Main St', creditLimit: 50000 },
  { id: 'CUST002', name: 'Home Renovations Inc', contact: 'Rachel Zane', phone: '555-0202', address: '321 Oak Ave', creditLimit: 25000 },
];

// Seed some initial stock via transactions
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'PUR001', date: '2023-10-01', entityId: 'SUP001', entityName: 'ABC Build Supplies', invoiceNo: 'INV-ABC-001', type: 'PURCHASE', totalAmount: 39000,
    items: [{ sku: 'PRD001', productName: 'Steel Rod 1/2"', unit: 'ft', quantity: 200, unitPrice: 200, total: 40000 }]
  },
  {
    id: 'PUR002', date: '2023-10-02', entityId: 'SUP002', entityName: 'XYZ Cement Works', invoiceNo: 'INV-XYZ-099', type: 'PURCHASE', totalAmount: 120000,
    items: [{ sku: 'PRD002', productName: 'Cement Bag 50kg', unit: 'bag', quantity: 100, unitPrice: 1200, total: 120000 }]
  },
  {
    id: 'SAL001', date: '2023-10-05', entityId: 'CUST001', entityName: 'BuildIt Construction', invoiceNo: 'INV-001', type: 'SALE', totalAmount: 5200,
    items: [{ sku: 'PRD001', productName: 'Steel Rod 1/2"', unit: 'ft', quantity: 20, unitPrice: 260, total: 5200 }]
  }
];

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [productStocks, setProductStocks] = useState<Record<string, ProductStock>>({});

  // Load data from localStorage or seed
  useEffect(() => {
    const storedProducts = localStorage.getItem('products');
    const storedSuppliers = localStorage.getItem('suppliers');
    const storedCustomers = localStorage.getItem('customers');
    const storedTransactions = localStorage.getItem('transactions');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    else setProducts(INITIAL_PRODUCTS);

    if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
    else setSuppliers(INITIAL_SUPPLIERS);

    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    else setCustomers(INITIAL_CUSTOMERS);

    if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    else setTransactions(INITIAL_TRANSACTIONS);
  }, []);

  // Save data to localStorage on change
  useEffect(() => {
    if (products.length > 0) localStorage.setItem('products', JSON.stringify(products));
    if (suppliers.length > 0) localStorage.setItem('suppliers', JSON.stringify(suppliers));
    if (customers.length > 0) localStorage.setItem('customers', JSON.stringify(customers));
    if (transactions.length > 0) localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [products, suppliers, customers, transactions]);

  // Calculate stocks whenever transactions or products change
  useEffect(() => {
    const stocks: Record<string, ProductStock> = {};

    products.forEach(p => {
      stocks[p.sku] = {
        sku: p.sku,
        currentStock: 0,
        stockValue: 0
      };
    });

    transactions.forEach(t => {
      t.items.forEach(item => {
        if (!stocks[item.sku]) return;
        
        // AUTOMATION: Add or Subtract from Stock based on Transaction Type
        if (t.type === 'PURCHASE' || t.type === 'ADJUSTMENT_IN') {
          stocks[item.sku].currentStock += item.quantity;
        } else if (t.type === 'SALE' || t.type === 'ADJUSTMENT_OUT') {
          stocks[item.sku].currentStock -= item.quantity;
        }
      });
    });

    // Calculate Value based on current Product Purchase Price
    Object.values(stocks).forEach(stock => {
      const product = products.find(p => p.sku === stock.sku);
      if (product) {
        stock.stockValue = stock.currentStock * product.purchasePrice;
      }
    });

    setProductStocks(stocks);
  }, [transactions, products]);

  const addProduct = (p: Product) => setProducts(prev => [...prev, p]);
  const updateProduct = (p: Product) => setProducts(prev => prev.map(item => item.sku === p.sku ? p : item));

  const addSupplier = (s: Supplier) => setSuppliers(prev => [...prev, s]);
  const updateSupplier = (s: Supplier) => setSuppliers(prev => prev.map(item => item.id === s.id ? s : item));

  const addCustomer = (c: Customer) => setCustomers(prev => [...prev, c]);
  const updateCustomer = (c: Customer) => setCustomers(prev => prev.map(item => item.id === c.id ? c : item));

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);

    // PRICES STORY: Automatically update the Master Product Price if we just bought it for a different price.
    // This ensures the "Stock Value" reflects the latest replacement cost.
    if (t.type === 'PURCHASE') {
      setProducts(prevProducts => prevProducts.map(product => {
        // Find if this product was in the transaction
        const itemInTransaction = t.items.find(item => item.sku === product.sku);
        if (itemInTransaction) {
          // Update the purchase price to the new price
          return { ...product, purchasePrice: itemInTransaction.unitPrice };
        }
        return product;
      }));
    }
  };

  const updateTransaction = (t: Transaction) => setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  // Enhanced Delete Product: Prevents deletion if history exists
  const deleteProduct = (sku: string) => {
    const hasHistory = transactions.some(t => t.items.some(i => i.sku === sku));
    if (hasHistory) {
      alert("Cannot delete this product because it has associated sales or purchase records. Please delete the transactions first if you really need to remove this product.");
      return;
    }
    setProducts(prev => prev.filter(p => p.sku !== sku));
  };

  // Enhanced Delete Supplier: Checks for association
  const deleteSupplier = (id: string) => {
    const hasProducts = products.some(p => p.supplierId === id);
    const hasTransactions = transactions.some(t => t.entityId === id);
    
    if (hasProducts || hasTransactions) {
      alert("Cannot delete Supplier. They are linked to existing products or purchase history.");
      return;
    }
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const deleteCustomer = (id: string) => {
     const hasTransactions = transactions.some(t => t.entityId === id);
     if (hasTransactions) {
       alert("Cannot delete Customer. They have sales history.");
       return;
     }
     setCustomers(prev => prev.filter(c => c.id !== id));
  }

  const getProductStock = (sku: string) => productStocks[sku] || { sku, currentStock: 0, stockValue: 0 };

  const resetData = () => {
    localStorage.clear();
    window.location.reload();
  }

  return (
    <InventoryContext.Provider value={{
      products, suppliers, customers, transactions, productStocks,
      addProduct, updateProduct,
      addSupplier, updateSupplier,
      addCustomer, updateCustomer,
      addTransaction, updateTransaction, deleteTransaction,
      deleteProduct, deleteSupplier, deleteCustomer,
      getProductStock, resetData
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};