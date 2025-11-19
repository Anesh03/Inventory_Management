
import React, { useMemo, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Search, Download, ArrowUpRight, ArrowDownLeft, Printer } from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { transactions } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');

  // Logic to build the Ledger
  // Sort all transactions by date ascending to calculate running balance
  const ledgerData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;
    
    return sorted.map(t => {
      const isPurchase = t.type === 'PURCHASE';
      const debit = isPurchase ? t.totalAmount : 0;   // Money Out (Purchase)
      const credit = !isPurchase ? t.totalAmount : 0; // Money In (Sale)
      
      // Simple Cash Flow Logic: Sales increase cash, Purchases decrease cash
      // In a strict accounting sense, Purchase is Debit to Inventory, Credit to Cash.
      // Here we track "Cash Flow / Net Value" movement.
      runningBalance = runningBalance + credit - debit;

      return {
        ...t,
        debit,
        credit,
        balance: runningBalance
      };
    }).reverse(); // Reverse for display (newest first) but maintain correct balance calculation from oldest
  }, [transactions]);

  const filteredLedger = useMemo(() => {
    return ledgerData.filter(item => 
      item.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ledgerData, searchTerm]);

  // Calculate Totals
  const totalDebit = transactions.filter(t => t.type === 'PURCHASE').reduce((acc, t) => acc + t.totalAmount, 0);
  const totalCredit = transactions.filter(t => t.type === 'SALE').reduce((acc, t) => acc + t.totalAmount, 0);
  const netBalance = totalCredit - totalDebit;

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const element = document.getElementById('ledger-content');
    if (!element) return;

    const opt = {
      margin: 5,
      filename: `Ledger_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save();
    } else {
      alert('PDF Generator is initializing. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
         <div>
           <h2 className="text-2xl font-bold text-slate-800">Accounts Ledger</h2>
           <p className="text-slate-500 text-sm">Track financial flow, income, and expenses.</p>
         </div>
         <div className="flex gap-2">
            <button onClick={handleDownload} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-all shadow-sm">
              <Download size={18} /> Download PDF
            </button>
            <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-all shadow-sm">
              <Printer size={18} /> Print
            </button>
         </div>
      </div>

      {/* Printable Area Wrapper */}
      <div id="ledger-content" className="print-section space-y-6">
        
        {/* Title for Print Only */}
        <div className="hidden print:block mb-4">
           <h1 className="text-2xl font-bold text-slate-900">Financial Ledger Report</h1>
           <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 relative overflow-hidden print-no-bg">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ArrowDownLeft size={48} className="text-red-600"/></div>
            <p className="text-sm font-medium text-slate-500 uppercase">Total Purchases (Debit)</p>
            <p className="text-2xl font-bold text-red-600 mt-1">-${totalDebit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 relative overflow-hidden print-no-bg">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ArrowUpRight size={48} className="text-green-600"/></div>
            <p className="text-sm font-medium text-slate-500 uppercase">Total Sales (Credit)</p>
            <p className="text-2xl font-bold text-green-600 mt-1">+${totalCredit.toLocaleString()}</p>
          </div>
          <div className={`bg-white p-6 rounded-lg shadow-sm border border-slate-200 relative overflow-hidden print-no-bg ${netBalance >= 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
            <p className="text-sm font-medium text-slate-500 uppercase">Net Cash Balance</p>
            <p className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
              {netBalance >= 0 ? '+' : ''}${netBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden print-no-bg">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-4 print-no-bg">
            <h3 className="font-bold text-slate-800">Transaction Ledger</h3>
            <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-lg px-3 py-2 w-full md:w-80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 no-print">
              <Search className="text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="bg-transparent border-none outline-none flex-1 text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider print-no-bg">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Ref ID</th>
                  <th className="px-6 py-3 font-medium">Account / Entity</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium text-right text-red-600">Debit</th>
                  <th className="px-6 py-3 font-medium text-right text-green-600">Credit</th>
                  <th className="px-6 py-3 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors print-no-bg">
                    <td className="px-6 py-3 text-slate-600 whitespace-nowrap">{row.date}</td>
                    <td className="px-6 py-3 text-xs font-mono text-slate-500">{row.invoiceNo}</td>
                    <td className="px-6 py-3 font-medium text-slate-800">{row.entityName}</td>
                    <td className="px-6 py-3 text-xs">
                      <span className={`px-2 py-1 rounded-full font-medium border ${row.type === 'SALE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-slate-600">
                      {row.debit > 0 ? `-$${row.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-slate-600">
                      {row.credit > 0 ? `+$${row.credit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-3 text-right font-bold font-mono text-slate-800">
                      ${row.balance.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filteredLedger.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No ledger entries found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
