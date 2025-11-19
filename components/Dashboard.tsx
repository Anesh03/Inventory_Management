import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { ProductStock, Supplier } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Package, DollarSign, Layers, X, Phone, MapPin, User, Building, History } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Dashboard: React.FC = () => {
  const { products, productStocks, transactions, suppliers } = useInventory();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [noSupplierFound, setNoSupplierFound] = useState(false);

  // Calculate Metrics
  const totalProducts = products.length;
  const totalStockValue = Object.values(productStocks).reduce((acc: number, curr: ProductStock) => acc + curr.stockValue, 0);
  const totalQuantity = Object.values(productStocks).reduce((acc: number, curr: ProductStock) => acc + curr.currentStock, 0);
  const lowStockCount = products.filter(p => {
    const stock = productStocks[p.sku]?.currentStock || 0;
    return stock <= p.reorderLevel;
  }).length;

  // Prepare Chart Data
  const topProductsData = products
    .map(p => ({
      name: p.name,
      value: productStocks[p.sku]?.stockValue || 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const categoryDataMap: Record<string, number> = {};
  products.forEach(p => {
    const stockVal = productStocks[p.sku]?.stockValue || 0;
    categoryDataMap[p.category] = (categoryDataMap[p.category] || 0) + stockVal;
  });
  
  const categoryData = Object.keys(categoryDataMap).map(key => ({
    name: key,
    value: categoryDataMap[key]
  }));

  const handleCheckSupplier = (sku: string) => {
    const product = products.find(p => p.sku === sku);
    let supplierId = product?.supplierId;

    // If no default supplier, try to find one from purchase history
    if (!supplierId) {
      const purchase = transactions
        .filter(t => t.type === 'PURCHASE' && t.items.some(i => i.sku === sku))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (purchase) {
        supplierId = purchase.entityId;
      }
    }

    if (supplierId) {
      const supplier = suppliers.find(s => s.id === supplierId);
      if (supplier) {
        setSelectedSupplier(supplier);
        return;
      }
    }
    
    // No supplier found in product settings OR history
    setNoSupplierFound(true);
  };

  const StatCard = ({ title, value, icon: Icon, color, alert }: any) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between ${alert ? 'border-red-400 bg-red-50' : ''}`}>
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-slate-800'}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Products" value={totalProducts} icon={Package} color="bg-blue-500" />
        <StatCard 
          title="Total Stock Value" 
          value={`$${totalStockValue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-green-500" 
        />
        <StatCard title="Quantity on Hand" value={totalQuantity.toLocaleString()} icon={Layers} color="bg-indigo-500" />
        <StatCard 
          title="Low Stock Alerts" 
          value={lowStockCount} 
          icon={AlertTriangle} 
          color="bg-red-500" 
          alert={lowStockCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Top Products Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Top Products by Value</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Stock Value by Category</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle size={20} />
            Low Stock Warnings
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Product Name</th>
                <th className="px-6 py-3 font-medium">Reorder Level</th>
                <th className="px-6 py-3 font-medium">Current Stock</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products
                .filter(p => (productStocks[p.sku]?.currentStock || 0) <= p.reorderLevel)
                .map(p => (
                  <tr key={p.sku} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-sm text-slate-600">{p.sku}</td>
                    <td className="px-6 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-6 py-3 text-slate-600">{p.reorderLevel}</td>
                    <td className="px-6 py-3 text-red-600 font-bold">{productStocks[p.sku]?.currentStock || 0}</td>
                    <td className="px-6 py-3 text-sm">
                      <button 
                        onClick={() => handleCheckSupplier(p.sku)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1 transition-colors"
                      >
                        Check Suppliers
                      </button>
                    </td>
                  </tr>
              ))}
              {lowStockCount === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No low stock alerts. Inventory looks healthy!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Details Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Building size={20}/> Supplier Details
              </h3>
              <button onClick={() => setSelectedSupplier(null)} className="hover:bg-blue-700 p-1 rounded"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
               <div className="text-center mb-4">
                 <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                   <Building size={32} />
                 </div>
                 <h4 className="text-xl font-bold text-slate-800">{selectedSupplier.name}</h4>
                 <p className="text-slate-500 text-sm font-mono">{selectedSupplier.id}</p>
               </div>
               
               <div className="space-y-3">
                 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                   <User className="text-slate-400 mt-1" size={18} />
                   <div>
                     <p className="text-xs text-slate-500 font-medium uppercase">Contact Person</p>
                     <p className="text-slate-800 font-medium">{selectedSupplier.contact}</p>
                   </div>
                 </div>
                 
                 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                   <Phone className="text-slate-400 mt-1" size={18} />
                   <div>
                     <p className="text-xs text-slate-500 font-medium uppercase">Phone</p>
                     <p className="text-slate-800 font-medium">{selectedSupplier.phone}</p>
                   </div>
                 </div>

                 <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                   <MapPin className="text-slate-400 mt-1" size={18} />
                   <div>
                     <p className="text-xs text-slate-500 font-medium uppercase">Address</p>
                     <p className="text-slate-800 whitespace-pre-line">{selectedSupplier.address}</p>
                   </div>
                 </div>
               </div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Supplier Found Modal */}
      {noSupplierFound && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <History size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No Supplier Found</h3>
            <p className="text-slate-600 mb-6">
              We couldn't find a default supplier or purchase history for this product. Please edit the product to assign a default supplier.
            </p>
            <button 
              onClick={() => setNoSupplierFound(false)}
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};