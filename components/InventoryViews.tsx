import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product, Supplier, Customer } from '../types';
import { Plus, Trash2, Search, Edit2, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Eye, BarChart2, Tag, DollarSign, Building } from 'lucide-react';

// --- Shared Components ---

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: string;
  direction: SortDirection;
}

const TableHeader: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  sortable?: boolean;
  currentSort?: SortConfig | null;
  sortKey?: string;
}> = ({ children, onClick, sortable, currentSort, sortKey }) => (
  <th 
    className={`px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${sortable ? 'cursor-pointer hover:bg-slate-200 select-none transition-colors' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-1">
      {children}
      {sortable && sortKey && (
        <span className="text-slate-400">
          {currentSort?.key === sortKey ? (
            currentSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          ) : (
            <ArrowUpDown size={14} opacity={0.5} />
          )}
        </span>
      )}
    </div>
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <td className={`px-4 py-3 text-sm text-slate-700 whitespace-nowrap ${className}`}>{children}</td>
);

const ActionButton: React.FC<{ onClick: () => void; icon: any; colorClass: string; title?: string }> = ({ onClick, icon: Icon, colorClass, title }) => (
  <button onClick={onClick} title={title} className={`p-1.5 rounded hover:bg-slate-100 ${colorClass} transition-colors`}>
    <Icon size={16} />
  </button>
);

const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}> = ({ currentPage, totalPages, onPageChange, totalItems, startIndex, endIndex }) => (
  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 px-4 py-3 gap-4 bg-white">
    <div>
      <p className="text-sm text-slate-700">
        Showing <span className="font-medium">{totalItems > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of <span className="font-medium">{totalItems}</span> results
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-medium text-slate-700 min-w-[80px] text-center">
        Page {currentPage} of {totalPages || 1}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="p-2 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

// --- Product List ---
export const ProductList: React.FC = () => {
  const { products, productStocks, suppliers, transactions, addProduct, updateProduct, deleteProduct } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Low Stock, In Stock
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'stock', direction: 'asc' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState<Partial<Product>>({});

  // Derive categories for filter
  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // Process Data: Enrich -> Filter -> Sort
  const processedProducts = useMemo(() => {
    let data = products.map(p => {
      const stock = productStocks[p.sku]?.currentStock || 0;
      const supplier = suppliers.find(s => s.id === p.supplierId);
      return {
        ...p,
        stock,
        value: productStocks[p.sku]?.stockValue || 0,
        supplierName: supplier ? supplier.name : 'N/A',
        profit: p.salePrice - p.purchasePrice,
        margin: p.salePrice > 0 ? ((p.salePrice - p.purchasePrice) / p.salePrice) * 100 : 0
      };
    });

    // Filter
    data = data.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'Low Stock') matchesStatus = p.stock <= p.reorderLevel;
      if (statusFilter === 'In Stock') matchesStatus = p.stock > p.reorderLevel;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort
    if (sortConfig) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof typeof a];
        const bVal = b[sortConfig.key as keyof typeof b];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [products, productStocks, suppliers, searchTerm, categoryFilter, statusFilter, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({});
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sku && formData.name) {
      if (isEditing) {
        updateProduct(formData as Product);
      } else {
        if (products.some(p => p.sku === formData.sku)) {
            alert('SKU already exists!');
            return;
        }
        addProduct(formData as Product);
      }
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Products Inventory</h2>
        <button 
          onClick={handleAdd} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
           <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-lg px-3 py-2 w-full lg:w-96 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
             <Search className="text-slate-400" size={18} />
             <input 
              type="text" 
              placeholder="Search SKU or Name..." 
              className="bg-transparent border-none outline-none flex-1 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
             <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1">
                <Filter className="text-slate-400 ml-2" size={16} />
                <select 
                  className="bg-transparent text-slate-700 text-sm border-none focus:ring-0 p-1 cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="In Stock">In Stock</option>
                </select>
             </div>
             <select 
               className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer"
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value)}
             >
               {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <TableHeader sortable onClick={() => handleSort('sku')} currentSort={sortConfig} sortKey="sku">SKU</TableHeader>
                <TableHeader sortable onClick={() => handleSort('name')} currentSort={sortConfig} sortKey="name">Name</TableHeader>
                <TableHeader sortable onClick={() => handleSort('category')} currentSort={sortConfig} sortKey="category">Category</TableHeader>
                <TableHeader sortable onClick={() => handleSort('supplierName')} currentSort={sortConfig} sortKey="supplierName">Supplier</TableHeader>
                <TableHeader sortable onClick={() => handleSort('purchasePrice')} currentSort={sortConfig} sortKey="purchasePrice">Cost</TableHeader>
                <TableHeader sortable onClick={() => handleSort('salePrice')} currentSort={sortConfig} sortKey="salePrice">Price</TableHeader>
                <TableHeader sortable onClick={() => handleSort('stock')} currentSort={sortConfig} sortKey="stock">Stock</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentItems.length > 0 ? currentItems.map(p => {
                const isLow = p.stock <= p.reorderLevel;
                const isOut = p.stock === 0;
                return (
                  <tr key={p.sku} className="hover:bg-slate-50 transition-colors">
                    <TableCell><span className="font-mono text-slate-500">{p.sku}</span></TableCell>
                    <TableCell><span className="font-medium text-slate-800">{p.name}</span></TableCell>
                    <TableCell><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{p.category}</span></TableCell>
                    <TableCell><span className="text-slate-600 text-xs truncate max-w-[120px] block" title={p.supplierName}>{p.supplierName}</span></TableCell>
                    <TableCell>${p.purchasePrice}</TableCell>
                    <TableCell>${p.salePrice}</TableCell>
                    <TableCell className="font-bold text-slate-700">{p.stock} {p.unit}</TableCell>
                    <TableCell>
                       {isOut ? (
                         <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                       ) : isLow ? (
                         <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Low Stock</span>
                       ) : (
                         <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">In Stock</span>
                       )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                         <ActionButton onClick={() => handleDetails(p)} icon={Eye} colorClass="text-indigo-500" title="View Details" />
                         <ActionButton onClick={() => handleEdit(p)} icon={Edit2} colorClass="text-blue-500" title="Edit Product" />
                         <ActionButton onClick={() => deleteProduct(p.sku)} icon={Trash2} colorClass="text-red-500" title="Delete Product" />
                      </div>
                    </TableCell>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="text-center p-12 text-slate-500">
                    <p>No products match your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={processedProducts.length}
          onPageChange={setCurrentPage}
          startIndex={indexOfFirstItem}
          endIndex={indexOfLastItem}
        />
      </div>

      {/* Product Details Modal */}
      {isDetailModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden">
             <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-lg font-bold">{selectedProduct.name}</h3>
                  <p className="text-xs opacity-80 font-mono">{selectedProduct.sku}</p>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="hover:bg-white/20 p-1 rounded"><div className="w-6 h-6 flex items-center justify-center"><ArrowDown size={20}/></div></button>
             </div>
             
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Stats */}
                <div className="space-y-6">
                   <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <Tag size={16} /> Product Specifications
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                         <div className="flex justify-between text-sm"><span className="text-slate-500">Category:</span> <span className="font-medium">{selectedProduct.category}</span></div>
                         <div className="flex justify-between text-sm"><span className="text-slate-500">Unit:</span> <span className="font-medium">{selectedProduct.unit}</span></div>
                         <div className="flex justify-between text-sm"><span className="text-slate-500">Reorder Level:</span> <span className="font-medium text-orange-600">{selectedProduct.reorderLevel}</span></div>
                      </div>
                   </div>

                   <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <DollarSign size={16} /> Pricing & Margin
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                         <div className="flex justify-between text-sm"><span className="text-slate-500">Cost Price:</span> <span className="font-medium">${selectedProduct.purchasePrice}</span></div>
                         <div className="flex justify-between text-sm"><span className="text-slate-500">Selling Price:</span> <span className="font-medium">${selectedProduct.salePrice}</span></div>
                         <div className="border-t border-slate-200 my-2 pt-2 flex justify-between text-sm">
                            <span className="text-slate-500 font-bold">Profit / Unit:</span> 
                            <span className="font-bold text-green-600">
                              ${(selectedProduct.salePrice - selectedProduct.purchasePrice).toFixed(2)} 
                              <span className="text-xs text-slate-400 font-normal ml-1">
                                ({((selectedProduct.salePrice - selectedProduct.purchasePrice)/selectedProduct.salePrice * 100).toFixed(1)}%)
                              </span>
                            </span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Right Column: Supply Chain */}
                <div className="space-y-6">
                   <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <Building size={16} /> Supply Chain
                      </h4>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                         <p className="text-xs text-blue-500 font-bold uppercase mb-1">Primary Supplier</p>
                         {(() => {
                            const supplier = suppliers.find(s => s.id === selectedProduct.supplierId);
                            return supplier ? (
                               <div>
                                  <p className="font-bold text-slate-800 text-lg">{supplier.name}</p>
                                  <p className="text-sm text-slate-600">{supplier.contact} • {supplier.phone}</p>
                                  <p className="text-xs text-slate-500 mt-2">{supplier.address}</p>
                               </div>
                            ) : (
                               <p className="text-sm text-slate-500 italic">No default supplier assigned.</p>
                            );
                         })()}
                      </div>
                   </div>

                   <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <BarChart2 size={16} /> Current Stock Status
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white border p-3 rounded-lg text-center shadow-sm">
                            <p className="text-xs text-slate-500">Quantity</p>
                            <p className="text-2xl font-bold text-slate-800">{productStocks[selectedProduct.sku]?.currentStock || 0}</p>
                         </div>
                         <div className="bg-white border p-3 rounded-lg text-center shadow-sm">
                            <p className="text-xs text-slate-500">Total Value</p>
                            <p className="text-2xl font-bold text-green-600">${(productStocks[selectedProduct.sku]?.stockValue || 0).toLocaleString()}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             <div className="bg-slate-50 px-6 py-4 flex justify-end">
                <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded hover:bg-slate-300">Close</button>
             </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-slate-800">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SKU (Unique ID)</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. PRD001"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  value={formData.sku || ''}
                  disabled={isEditing}
                  onChange={e => setFormData({...formData, sku: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input required type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <input 
                  required 
                  type="text" 
                  list="category-suggestions"
                  placeholder="e.g. Steel, Cement"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.category || ''} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                />
                <datalist id="category-suggestions">
                   {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}/>)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit (e.g. kg, ft)</label>
                <input required type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Cost</label>
                <input required type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.purchasePrice || ''} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} />
                <p className="text-xs text-slate-500 mt-1">Auto-updates on new purchase.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price</label>
                <input required type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.salePrice || ''} onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                <input required type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.reorderLevel || ''} onChange={e => setFormData({...formData, reorderLevel: Number(e.target.value)})} />
              </div>
              <div className="md:col-span-2 bg-blue-50 p-3 rounded border border-blue-100">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Default Supplier</label>
                 <select 
                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   value={formData.supplierId || ''}
                   onChange={e => setFormData({...formData, supplierId: e.target.value})}
                 >
                   <option value="">-- Select Primary Supplier --</option>
                   {suppliers.map(s => (
                     <option key={s.id} value={s.id}>{s.name}</option>
                   ))}
                 </select>
                 <p className="text-xs text-slate-500 mt-1">Linking a supplier allows for faster reordering.</p>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-all">{isEditing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Supplier List ---
export const SupplierList: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'asc' });
  const [formData, setFormData] = useState<Partial<Supplier>>({});
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const processedSuppliers = useMemo(() => {
    let data = suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
    );

    if (sortConfig) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof typeof a] || '';
        const bVal = b[sortConfig.key as keyof typeof b] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [suppliers, searchTerm, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedSuppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedSuppliers.length / itemsPerPage);

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAdd = () => {
    setFormData({});
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (s: Supplier) => {
    setFormData(s);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id && formData.name) {
      if (isEditing) {
        updateSupplier(formData as Supplier);
      } else {
        if (suppliers.some(s => s.id === formData.id)) {
            alert('Supplier ID already exists!');
            return;
        }
        addSupplier(formData as Supplier);
      }
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Suppliers</h2>
        <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all">
          <Plus size={18} /> Add Supplier
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
           <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-lg px-3 py-2 w-full md:w-80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
             <Search className="text-slate-400" size={18} />
             <input 
              type="text" 
              placeholder="Search by name, contact or phone..." 
              className="bg-transparent border-none outline-none flex-1 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <TableHeader sortable onClick={() => handleSort('id')} currentSort={sortConfig} sortKey="id">ID</TableHeader>
                <TableHeader sortable onClick={() => handleSort('name')} currentSort={sortConfig} sortKey="name">Name</TableHeader>
                <TableHeader sortable onClick={() => handleSort('contact')} currentSort={sortConfig} sortKey="contact">Contact Person</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Address</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentItems.length > 0 ? currentItems.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                   <TableCell><span className="font-mono text-slate-500">{s.id}</span></TableCell>
                   <TableCell className="font-medium text-slate-800">{s.name}</TableCell>
                   <TableCell>{s.contact}</TableCell>
                   <TableCell>{s.phone}</TableCell>
                   <TableCell>{s.address}</TableCell>
                   <TableCell>
                      <div className="flex gap-2">
                        <ActionButton onClick={() => handleEdit(s)} icon={Edit2} colorClass="text-blue-500" />
                        <ActionButton onClick={() => deleteSupplier(s.id)} icon={Trash2} colorClass="text-red-500" />
                      </div>
                   </TableCell>
                </tr>
              )) : (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No suppliers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={processedSuppliers.length}
          onPageChange={setCurrentPage}
          startIndex={indexOfFirstItem}
          endIndex={indexOfLastItem}
        />
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-slate-800">{isEditing ? 'Edit Supplier' : 'Add New Supplier'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                placeholder="Supplier ID" 
                required 
                type="text" 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                value={formData.id || ''} 
                disabled={isEditing}
                onChange={e => setFormData({...formData, id: e.target.value})} 
              />
              <input placeholder="Company Name" required type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="Contact Person" required type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.contact || ''} onChange={e => setFormData({...formData, contact: e.target.value})} />
              <input placeholder="Phone" required type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input placeholder="Address" required type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-all">{isEditing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Customer List ---
export const CustomerList: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'asc' });
  const [formData, setFormData] = useState<Partial<Customer>>({});
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const processedCustomers = useMemo(() => {
    let data = customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );

    if (sortConfig) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof typeof a] || '';
        const bVal = b[sortConfig.key as keyof typeof b] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [customers, searchTerm, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedCustomers.length / itemsPerPage);

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAdd = () => {
    setFormData({});
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (c: Customer) => {
    setFormData(c);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id && formData.name) {
      if (isEditing) {
        updateCustomer(formData as Customer);
      } else {
        if (customers.some(c => c.id === formData.id)) {
            alert('Customer ID already exists!');
            return;
        }
        addCustomer(formData as Customer);
      }
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Customers</h2>
        <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all">
          <Plus size={18} /> Add Customer
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
           <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-lg px-3 py-2 w-full md:w-80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
             <Search className="text-slate-400" size={18} />
             <input 
              type="text" 
              placeholder="Search by name, contact or phone..." 
              className="bg-transparent border-none outline-none flex-1 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <TableHeader sortable onClick={() => handleSort('id')} currentSort={sortConfig} sortKey="id">ID</TableHeader>
                <TableHeader sortable onClick={() => handleSort('name')} currentSort={sortConfig} sortKey="name">Name</TableHeader>
                <TableHeader sortable onClick={() => handleSort('contact')} currentSort={sortConfig} sortKey="contact">Contact Person</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Credit Limit</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentItems.length > 0 ? currentItems.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                   <TableCell><span className="font-mono text-slate-500">{c.id}</span></TableCell>
                   <TableCell className="font-medium text-slate-800">{c.name}</TableCell>
                   <TableCell>{c.contact}</TableCell>
                   <TableCell>{c.phone}</TableCell>
                   <TableCell>${c.creditLimit?.toLocaleString()}</TableCell>
                   <TableCell>
                      <div className="flex gap-2">
                        <ActionButton onClick={() => handleEdit(c)} icon={Edit2} colorClass="text-blue-500" />
                        <ActionButton onClick={() => deleteCustomer(c.id)} icon={Trash2} colorClass="text-red-500" />
                      </div>
                   </TableCell>
                </tr>
              )) : (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={processedCustomers.length}
          onPageChange={setCurrentPage}
          startIndex={indexOfFirstItem}
          endIndex={indexOfLastItem}
        />
      </div>
       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-slate-800">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                placeholder="Customer ID" 
                required 
                type="text" 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                value={formData.id || ''} 
                disabled={isEditing}
                onChange={e => setFormData({...formData, id: e.target.value})} 
              />
              <input placeholder="Customer Name" required type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="Contact Person" required type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.contact || ''} onChange={e => setFormData({...formData, contact: e.target.value})} />
              <input placeholder="Phone" required type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input placeholder="Credit Limit" required type="number" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.creditLimit || ''} onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})} />
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-all">{isEditing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};