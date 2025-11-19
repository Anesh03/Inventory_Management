
import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, DollarSign } from 'lucide-react';

type Period = 'DAILY' | 'MONTHLY' | 'YEARLY';

export const ReportsView: React.FC = () => {
  const { transactions } = useInventory();
  const [activePeriod, setActivePeriod] = useState<Period>('DAILY');

  // Filter only sales
  const sales = useMemo(() => transactions.filter(t => t.type === 'SALE'), [transactions]);

  // Aggregate Data Logic
  const chartData = useMemo(() => {
    const groupedData: Record<string, number> = {};
    
    // Sort sales by date first
    const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedSales.forEach(sale => {
      const date = new Date(sale.date);
      let key = '';

      if (activePeriod === 'DAILY') {
        // Show last 30 days or just available days
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (activePeriod === 'MONTHLY') {
        key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else if (activePeriod === 'YEARLY') {
        key = date.getFullYear().toString();
      }

      groupedData[key] = (groupedData[key] || 0) + sale.totalAmount;
    });

    return Object.keys(groupedData).map(key => ({
      name: key,
      amount: groupedData[key]
    }));
  }, [sales, activePeriod]);

  // Calculate Summary Metrics for the period view
  const totalPeriodSales = chartData.reduce((acc, curr) => acc + curr.amount, 0);
  const averageSales = chartData.length > 0 ? totalPeriodSales / chartData.length : 0;
  const bestPeriod = chartData.length > 0 ? chartData.reduce((max, curr) => curr.amount > max.amount ? curr : max, chartData[0]) : { name: '-', amount: 0 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Sales Reports</h2>
        <div className="bg-white p-1 rounded-lg border border-slate-300 flex shadow-sm">
          <button 
            onClick={() => setActivePeriod('DAILY')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activePeriod === 'DAILY' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Daily
          </button>
          <button 
            onClick={() => setActivePeriod('MONTHLY')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activePeriod === 'MONTHLY' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setActivePeriod('YEARLY')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activePeriod === 'YEARLY' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={20} /></div>
            <p className="text-sm font-medium text-slate-500 uppercase">Total Sales ({activePeriod.toLowerCase()})</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${totalPeriodSales.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
           <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp size={20} /></div>
            <p className="text-sm font-medium text-slate-500 uppercase">Average Sales</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">${averageSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Calendar size={20} /></div>
            <p className="text-sm font-medium text-slate-500 uppercase">Best Performing</p>
          </div>
          <div>
             <p className="text-xl font-bold text-slate-800">{bestPeriod.name}</p>
             <p className="text-sm text-green-600 font-medium">+ ${bestPeriod.amount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Sales Trend</h3>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
             {activePeriod === 'DAILY' ? (
               <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" tick={{fontSize: 12}} />
                 <YAxis tickFormatter={(val) => `$${val}`} />
                 <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                 <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
               </LineChart>
             ) : (
               <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis tickFormatter={(val) => `$${val}`} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
             )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Detailed Breakdown</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Period</th>
              <th className="px-6 py-3 font-medium text-right">Sales Amount</th>
              <th className="px-6 py-3 font-medium text-right">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {[...chartData].reverse().map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                <td className="px-6 py-4 text-right font-mono text-slate-600">${item.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-slate-500">
                  {totalPeriodSales > 0 ? ((item.amount / totalPeriodSales) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
            {chartData.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No sales data available for this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
