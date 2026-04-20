"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
}

interface SearchBarProps {
  onSelect?: (stock: Stock) => void;
  className?: string;
}

// Mock available stocks
const availableStocks: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2455.0, change: 0.45, volume: 8500000 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3200.0, change: 1.2, volume: 2500000 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1420.0, change: -0.8, volume: 12000000 },
  { symbol: "INFY", name: "Infosys", price: 1150.0, change: 2.1, volume: 5000000 },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 980.0, change: 0.3, volume: 15000000 },
  { symbol: "SBIN", name: "State Bank of India", price: 580.0, change: -1.2, volume: 20000000 },
  { symbol: "ITC", name: "ITC Limited", price: 420.0, change: 0.5, volume: 6000000 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", price: 2500.0, change: 0.8, volume: 3000000 },
];

export function SearchBar({ onSelect, className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Stock[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = availableStocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
          stock.name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelect = (stock: Stock) => {
    setQuery("");
    setIsOpen(false);
    onSelect?.(stock);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search stocks..."
          className={cn(
            "w-full h-11 pl-10 pr-10 bg-surface/50 border border-divider rounded-xl",
            "text-sm text-text-primary placeholder:text-text-muted",
            "focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20",
            "transition-all duration-200"
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-surface-elevated border border-divider rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="max-h-64 overflow-y-auto">
              {results.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelect(stock)}
                  className="w-full p-3 hover:bg-surface/50 transition-colors flex items-center justify-between"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">
                      {stock.symbol}
                    </p>
                    <p className="text-xs text-text-muted">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-text-primary">
                      ₹{stock.price.toFixed(2)}
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
                      {stock.change >= 0 ? "+" : ""}
                      {stock.change.toFixed(2)}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}