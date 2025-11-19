import React from 'react';
import { Transaction } from '../types';
import { useInventory } from '../context/InventoryContext';
import { X, Printer, Download } from 'lucide-react';

export const InvoiceView: React.FC<{ transaction: Transaction; onClose: () => void }> = ({ transaction, onClose }) => {
  const { customers, suppliers } = useInventory();

  // Fetch Entity Details to clear placeholders
  const entity = transaction.type === 'PURCHASE' 
    ? suppliers.find(s => s.id === transaction.entityId)
    : customers.find(c => c.id === transaction.entityId);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `Invoice_${transaction.invoiceNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save();
    } else {
      alert('PDF Generator is initializing. Please try again or use Print > Save as PDF.');
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60] p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[95vh]">
        {/* Toolbar */}
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center no-print">
          <h3 className="text-lg font-semibold">Invoice Preview</h3>
          <div className="flex gap-3">
            <button 
              onClick={handleDownload} 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm transition-colors shadow-sm font-medium"
            >
              <Download size={16} /> Download PDF
            </button>
            <button 
              onClick={handlePrint} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm transition-colors shadow-sm font-medium"
            >
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="overflow-y-auto bg-slate-100 p-8 flex justify-center">
          <div id="invoice-content" className="print-section bg-white shadow-lg border border-slate-200 p-10 max-w-[210mm] w-full min-h-[297mm] relative text-slate-900">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-8">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">INVOICE</h1>
                <div className="mt-3 text-slate-600">
                  <p className="font-bold text-lg">Hardware Store Inc.</p>
                  <p className="text-sm">123 Construction Ave</p>
                  <p className="text-sm">Cityville, ST 12345</p>
                  <p className="text-sm mt-1">Phone: (555) 123-4567</p>
                </div>
              </div>
              <div className="text-right">
                <div className="px-4 py-2 rounded border border-slate-200 inline-block mb-4">
                  <h2 className="text-xl font-bold text-slate-800">#{transaction.invoiceNo}</h2>
                </div>
                <p className="text-slate-500 font-medium">Date: <span className="text-slate-800">{transaction.date}</span></p>
                <p className="text-xs text-slate-400 mt-1">Ref ID: {transaction.id}</p>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="mb-12 flex justify-between">
              <div className="w-1/2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
                <div className="text-slate-800">
                  <p className="text-xl font-bold">{transaction.entityName}</p>
                  <p className="text-slate-600 mt-1">{transaction.type === 'PURCHASE' ? 'Supplier' : 'Customer'} ID: {transaction.entityId}</p>
                  {entity?.address && (
                    <p className="text-slate-600 text-sm mt-2 whitespace-pre-line">{entity.address}</p>
                  )}
                  {entity?.phone && <p className="text-slate-600 text-sm">Phone: {entity.phone}</p>}
                </div>
              </div>
              <div className="w-1/2 text-right flex flex-col justify-end">
                 {/* Space reserved */}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-800">
                    <th className="text-left py-3 text-sm font-extrabold text-slate-800 uppercase tracking-wider w-1/2">Item Description</th>
                    <th className="text-center py-3 text-sm font-extrabold text-slate-800 uppercase tracking-wider">Unit</th>
                    <th className="text-center py-3 text-sm font-extrabold text-slate-800 uppercase tracking-wider">Qty</th>
                    <th className="text-right py-3 text-sm font-extrabold text-slate-800 uppercase tracking-wider">Price</th>
                    <th className="text-right py-3 text-sm font-extrabold text-slate-800 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transaction.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4 text-slate-700">
                        <p className="font-bold text-slate-800">{item.productName}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {item.sku}</p>
                      </td>
                      <td className="py-4 text-center text-slate-600 text-sm">{item.unit}</td>
                      <td className="py-4 text-center text-slate-800 font-semibold">{item.quantity}</td>
                      <td className="py-4 text-right text-slate-600 font-medium">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-4 text-right text-slate-900 font-bold">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-8 border-t border-slate-100 pt-8">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">${transaction.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (0%)</span>
                  <span className="font-semibold">$0.00</span>
                </div>
                <div className="flex justify-between pt-4 border-t-2 border-slate-800 text-xl font-extrabold text-slate-900 items-center">
                  <span>Total</span>
                  <span className="text-2xl">${transaction.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-10 left-10 right-10 text-center border-t border-slate-200 pt-6">
               <p className="text-slate-800 font-semibold">Thank you for your business!</p>
               <p className="text-slate-500 text-sm mt-2">For any inquiries, please contact support@hardwarestore.com</p>
               <p className="text-xs text-slate-400 mt-4">Terms & Conditions apply. Goods once sold cannot be returned.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};