import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { getInventoryInsights } from '../services/geminiService';
import { Sparkles, Send, X, Bot } from 'lucide-react';
import { ProductStock } from '../types';

export const AIAssistant: React.FC = () => {
  const { products, productStocks, transactions } = useInventory();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    
    // Prepare a lightweight summary to avoid token limits if inventory is huge
    const summary = {
      productsCount: products.length,
      lowStockItems: products.filter(p => (productStocks[p.sku]?.currentStock || 0) <= p.reorderLevel).map(p => ({
        name: p.name,
        current: productStocks[p.sku]?.currentStock,
        reorderLevel: p.reorderLevel
      })),
      topSellingItems: transactions // Rudimentary top selling logic for context
        .filter(t => t.type === 'SALE')
        .flatMap(t => t.items)
        .slice(0, 20), 
      totalValue: Object.values(productStocks).reduce((acc: number, curr: ProductStock) => acc + curr.stockValue, 0)
    };

    const result = await getInventoryInsights(summary, prompt);
    setResponse(result);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 z-40 flex items-center gap-2"
      >
        <Sparkles size={24} />
        <span className="font-semibold pr-2">AI Insights</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-indigo-100 z-50 flex flex-col overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-bold">Inventory Genius</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-1"><X size={18}/></button>
      </div>

      {/* Chat Area */}
      <div className="h-80 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-3">
        {response ? (
           <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-slate-700 whitespace-pre-wrap border border-slate-200 leading-relaxed">
             {response}
           </div>
        ) : (
          <div className="text-center text-slate-400 text-sm mt-10">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50"/>
            <p>Ask me anything about your inventory!</p>
            <div className="mt-4 space-y-2">
              <button onClick={() => setPrompt("What should I restock immediately?")} className="block w-full text-xs bg-white border p-2 rounded hover:bg-indigo-50 text-left transition-colors">
                "What should I restock immediately?"
              </button>
              <button onClick={() => setPrompt("Analyze my top selling products.")} className="block w-full text-xs bg-white border p-2 rounded hover:bg-indigo-50 text-left transition-colors">
                "Analyze my top selling products."
              </button>
            </div>
          </div>
        )}
        {loading && (
           <div className="flex gap-2 items-center text-slate-400 text-xs animate-pulse">
             <Bot size={14}/> Thinking...
           </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Ask AI..."
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          />
          <button 
            onClick={handleAnalyze}
            disabled={loading || !prompt}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};