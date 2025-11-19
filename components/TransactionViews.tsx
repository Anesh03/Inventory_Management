import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Transaction, TransactionItem } from '../types';
import { Plus, Trash2, ShoppingCart, Truck, FileText, Search, ArrowUpDown, ArrowUp, ArrowDown, Edit2, AlertTriangle } from 'lucide-react';
import { InvoiceView } from './InvoiceView';

// --- Transaction Form (Shared for Purchase & Sale) ---
interface TransactionFormProps {
  type: 'PURCHASE' | 'SALE';
  initialData?: Transaction;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ type, initialData, onClose }) => {
  const { products, productStocks, suppliers, customers, addTransaction, updateTransaction } = useInventory();
  const [entityId, setEntityId] = useState(initialData?.entityId || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState(initialData?.invoiceNo || '');
  const [items, setItems] = useState<TransactionItem[]>(initialData?.items || []);
  
  // Item entry state
  const [selectedSku, setSelectedSku] = useState('');
  const [qty, setQty] = useState(1);
  // State for custom unit price (allows overwriting default)
  const [customUnitPrice, setCustomUnitPrice] = useState<string>(''); 
  
  const currentProduct = products.find(p => p.sku === selectedSku);
  const currentStock = currentProduct ? (productStocks[currentProduct.sku]?.currentStock || 0) : 0;

  const addItem = () => {
    if (!currentProduct) return;

    // Validation: Check stock for Sales
    if (type === 'SALE' && qty > currentStock) {
      if (!window.confirm(`Warning: You only have ${currentStock} units in stock. Are you sure you want to sell ${qty}? This will result in negative stock.`)) {
        return;
      }
    }

    // Determine Price: Use custom price if entered, otherwise default from product
    const defaultPrice = type === 'PURCHASE' ? currentProduct.purchasePrice : currentProduct.salePrice;
    const finalPrice = customUnitPrice !== '' ? Number(customUnitPrice) : defaultPrice;

    const newItem: TransactionItem = {
      sku: currentProduct.sku,
      productName: currentProduct.name,
      unit: currentProduct.unit,
      quantity: qty,
      unitPrice: finalPrice,
      total: qty * finalPrice
    };
    setItems([...items, newItem]);
    
    // Reset fields
    setSelectedSku('');
    setQty(1);
    setCustomUnitPrice('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert("Please add at least one item.");
    
    const entity = type === 'PURCHASE' 
      ? suppliers.find(s => s.id === entityId) 
      : customers.find(c => c.id === entityId);

    if (!entity) return alert("Please select a valid Supplier/Customer");

    const transaction: Transaction = {
      id: initialData?.id || (type === 'PURCHASE' ? 'PUR' : 'SAL') + Date.now().toString().slice(-6),
      date,
      entityId,
      entityName: entity.name,
      invoiceNo,
      items,
      totalAmount: items.reduce((acc, curr) => acc + curr.total, 0),
      type
    };

    if (initialData) {
      updateTransaction(transaction);
    } else {
      addTransaction(transaction);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
           {type === 'PURCHASE' ? <Truck className="text-blue-600"/> : <ShoppingCart className="text-green-600"/>}
           {initialData ? 'Edit' : 'New'} {type === 'PURCHASE' ? 'Purchase Order' : 'Sales Invoice'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
           {/* Header Fields */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {type === 'PURCHASE' ? 'Supplier' : 'Customer'}
                </label>
                <select required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={entityId} onChange={e => setEntityId(e.target.value)}>
                  <option value="">Select...</option>
                  {type === 'PURCHASE' 
                    ? suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    : customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input required type="date" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Invoice No (Ref)</label>
                <input required type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
              </div>
           </div>

           {/* Item Entry Line */}
           <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner">
             <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                Add Items to {type === 'PURCHASE' ? 'Order' : 'Cart'}
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
               <div className="md:col-span-5">
                 <label className="block text-xs text-slate-500 mb-1">Product (Current Stock)</label>
                 <select className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={selectedSku} onChange={e => setSelectedSku(e.target.value)}>
                   <option value="">Select Product...</option>
                   {products.map(p => {
                     const stock = productStocks[p.sku]?.currentStock || 0;
                     return (
                       <option key={p.sku} value={p.sku}>
                         {p.name} (Stock: {stock})
                       </option>
                     );
                   })}
                 </select>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Qty</label>
                  <input type="number" min="1" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={qty} onChange={e => setQty(Number(e.target.value))} />
               </div>
               <div className="md:col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Unit Price ({type === 'PURCHASE' ? 'Cost' : 'Sale'})</label>
                  <input 
                    type="number" 
                    placeholder={currentProduct ? (type === 'PURCHASE' ? String(currentProduct.purchasePrice) : String(currentProduct.salePrice)) : '0.00'}
                    className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={customUnitPrice}
                    onChange={e => setCustomUnitPrice(e.target.value)}
                  />
               </div>
               <div className="md:col-span-2">
                  <button type="button" onClick={addItem} disabled={!currentProduct} className="w-full bg-slate-800 text-white p-2 rounded text-sm hover:bg-slate-700 disabled:opacity-50 transition-colors">Add Line</button>
               </div>
             </div>
             {/* Low Stock Warning Visual */}
             {type === 'SALE' && currentProduct && qty > currentStock && (
               <div className="mt-2 flex items-center gap-2 text-red-600 text-xs font-medium animate-pulse">
                  <AlertTriangle size={14} />
                  Warning: Quantity exceeds current stock ({currentStock}).
               </div>
             )}
           </div>

           {/* Items Table */}
           <div className="border rounded-lg overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-100">
                 <tr>
                   <th className="p-3">Product</th>
                   <th className="p-3">Qty</th>
                   <th className="p-3">Price</th>
                   <th className="p-3">Total</th>
                   <th className="p-3 w-10"></th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {items.map((item, idx) => (
                   <tr key={idx}>
                     <td className="p-3">{item.productName}</td>
                     <td className="p-3">{item.quantity} {item.unit}</td>
                     <td className="p-3">${item.unitPrice}</td>
                     <td className="p-3 font-medium">${item.total}</td>
                     <td className="p-3"><button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></td>
                   </tr>
                 ))}
                 {items.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-500">No items added</td></tr>}
               </tbody>
               <tfoot className="bg-slate-50 font-bold">
                 <tr>
                   <td colSpan={3} className="p-3 text-right">Total Amount:</td>
                   <td className="p-3 text-lg text-blue-600">${items.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</td>
                   <td></td>
                 </tr>
               </tfoot>
             </table>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t">
             <button type="button" onClick={onClose} className="px-6 py-2 border rounded text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
             <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-all">Save Transaction</button>
           </div>
        </form>
      </div>
    </div>
  );
};

// --- Transaction List View (Combined Logic) ---
export const TransactionList: React.FC<{ type: 'PURCHASE' | 'SALE' }> = ({ type }) => {
  const { transactions, deleteTransaction } = useInventory();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const processedTransactions = useMemo(() => {
    let data = transactions.filter(t => t.type === type);
    
    // Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(t => 
        t.id.toLowerCase().includes(lowerTerm) ||
        t.entityName.toLowerCase().includes(lowerTerm) ||
        t.invoiceNo.toLowerCase().includes(lowerTerm)
      );
    }

    // Sort
    data.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof typeof a] || '';
      const bVal = b[sortConfig.key as keyof typeof b] || '';
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [transactions, type, searchTerm, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const openNewForm = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Are you sure you want to delete this transaction? This will update stock levels accordingly.')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{type === 'PURCHASE' ? 'Purchase History' : 'Sales History'}</h2>
        <button onClick={openNewForm} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all">
          <Plus size={18} /> New {type === 'PURCHASE' ? 'Purchase' : 'Sale'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
           <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-lg px-3 py-2 w-full md:w-96 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
             <Search className="text-slate-400" size={18} />
             <input 
              type="text" 
              placeholder="Search by ID, Customer/Supplier, or Invoice No..." 
              className="bg-transparent border-none outline-none flex-1 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-slate-600 text-sm uppercase">
            <tr>
              <th className="px-6 py-3 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('date')}>
                <div className="flex items-center gap-1">Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}</div>
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-1">ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}</div>
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('entityName')}>
                <div className="flex items-center gap-1">{type === 'PURCHASE' ? 'Supplier' : 'Customer'} {sortConfig.key === 'entityName' && (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}</div>
              </th>
              <th className="px-6 py-3">Ref No</th>
              <th className="px-6 py-3 text-right cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => handleSort('totalAmount')}>
                 <div className="flex items-center justify-end gap-1">Amount {sortConfig.key === 'totalAmount' && (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}</div>
              </th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {processedTransactions.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 text-slate-600 whitespace-nowrap">{t.date}</td>
                <td className="px-6 py-3 font-mono text-xs text-slate-500">{t.id}</td>
                <td className="px-6 py-3 font-medium text-slate-800">{t.entityName}</td>
                <td className="px-6 py-3 text-slate-600">{t.invoiceNo}</td>
                <td className="px-6 py-3 text-right font-bold text-slate-700">${t.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-3 text-center">
                   <div className="flex items-center justify-center gap-2">
                     {type === 'SALE' && (
                       <button onClick={() => setSelectedInvoice(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Invoice">
                         <FileText size={16}/>
                       </button>
                     )}
                     <button onClick={() => handleEdit(t)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit Transaction">
                        <Edit2 size={16}/>
                     </button>
                     <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Transaction">
                        <Trash2 size={16}/>
                     </button>
                   </div>
                </td>
              </tr>
            ))}
             {processedTransactions.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <TransactionForm 
          type={type} 
          initialData={editingTransaction || undefined}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTransaction(null);
          }} 
        />
      )}
      {selectedInvoice && <InvoiceView transaction={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
    </div>
  );
};