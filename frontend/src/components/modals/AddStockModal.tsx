"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, TrendingUp, TrendingDown, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, ButtonMotion } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn, formatPrice, formatPercent } from "@/lib/utils";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
}

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (stock: Stock) => void;
}

// Available NSE stocks
const availableStocks: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2455.0, change: 0.45, volume: 8500000 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3200.0, change: 1.2, volume: 2500000 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1420.0, change: -0.8, volume: 12000000 },
  { symbol: "INFY", name: "Infosys", price: 1150.0, change: 2.1, volume: 5000000 },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 980.0, change: 0.3, volume: 15000000 },
  { symbol: "SBIN", name: "State Bank of India", price: 580.0, change: -1.2, volume: 20000000 },
  { symbol: "ITC", name: "ITC Limited", price: 420.0, change: 0.5, volume: 6000000 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", price: 2500.0, change: 0.8, volume: 3000000 },
  { symbol: "ADANIPORTS", name: "Adani Ports", price: 1200.0, change: 1.5, volume: 2000000 },
  { symbol: "AXISBANK", name: "Axis Bank", price: 950.0, change: -0.5, volume: 8000000 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", price: 1800.0, change: 0.8, volume: 1500000 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", price: 1600.0, change: 0.2, volume: 4000000 },
  { symbol: "MARUTI", name: "Maruti Suzuki", price: 4500.0, change: -0.3, volume: 500000 },
  { symbol: "SUNPHARMA", name: "Sun Pharma", price: 1100.0, change: 0.6, volume: 3000000 },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", price: 8500.0, change: 0.4, volume: 400000 },
];

export function AddStockModal({ isOpen, onClose, onAdd }: AddStockModalProps) {
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const filteredStocks = search.length > 0
    ? availableStocks.filter(
        (s) =>
          s.symbol.toLowerCase().includes(search.toLowerCase()) ||
          s.name.toLowerCase().includes(search.toLowerCase())
      )
    : availableStocks;

  const handleAdd = () => {
    if (selectedStock) {
      onAdd?.(selectedStock);
      setSearch("");
      setSelectedStock(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-surface-elevated border border-divider rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-divider">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Star className="w-4 h-4 text-accent-primary" />
                Add to Watchlist
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-divider">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search NSE stocks..."
                  className={cn(
                    "w-full h-11 pl-10 pr-4 bg-surface/50 border border-divider rounded-xl",
                    "text-sm text-text-primary placeholder:text-text-muted",
                    "focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20",
                    "transition-all duration-200"
                  )}
                />
              </div>
            </div>

            {/* Stock List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredStocks.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-text-muted">No stocks found</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={cn(
                        "w-full p-3 rounded-xl flex items-center justify-between transition-all duration-200",
                        selectedStock?.symbol === stock.symbol
                          ? "bg-accent-primary/15 border border-accent-primary/30"
                          : "hover:bg-surface/50 border border-transparent",
                        "border"
                      )}
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-text-primary">
                          {stock.symbol}
                        </p>
                        <p className="text-xs text-text-muted">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-text-primary">
                          {formatPrice(stock.price)}
                        </p>
                        <p
                          className={cn(
                            "text-xs font-mono flex items-center gap-1",
                            stock.change >= 0
                              ? "text-accent-positive"
                              : "text-accent-negative"
                          )}
                        >
                          {stock.change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {formatPercent(stock.change)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-divider flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!selectedStock}
                className="flex-1"
              >
                Add to Watchlist
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}