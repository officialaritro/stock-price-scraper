"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown, MoreHorizontal, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn, formatPrice, formatPercent } from "@/lib/utils";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
}

interface WatchlistGridProps {
  onSelectStock?: (stock: Stock) => void;
  onRemoveStock?: (symbol: string) => void;
}

// Initial watchlist
const initialStocks: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2455.0, change: 0.45, volume: 8500000 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3200.0, change: 1.2, volume: 2500000 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1420.0, change: -0.8, volume: 12000000 },
  { symbol: "INFY", name: "Infosys", price: 1150.0, change: 2.1, volume: 5000000 },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 980.0, change: 0.3, volume: 15000000 },
  { symbol: "SBIN", name: "State Bank of India", price: 580.0, change: -1.2, volume: 20000000 },
];

function StockCard({
  stock,
  onClick,
  onRemove,
  delay,
}: {
  stock: Stock;
  onClick?: () => void;
  onRemove?: () => void;
  delay: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 10;
      const newPrice = Math.max(0, stock.price + change);
      if (newPrice !== stock.price) {
        setPriceFlash(newPrice > stock.price ? "up" : "down");
        setTimeout(() => setPriceFlash(null), 600);
      }
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [stock.price]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlassCard
        variant="interactive"
        glowOnHover
        className={cn(
          "p-4 cursor-pointer transition-all duration-200",
          priceFlash === "up" && "animate-price-flash-up",
          priceFlash === "down" && "animate-price-flash-down"
        )}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-semibold text-text-primary">{stock.symbol}</h3>
              <Star className="w-3.5 h-3.5 text-accent-primary fill-accent-primary" />
            </div>
            <p className="text-xs text-text-muted truncate max-w-[140px]">
              {stock.name}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className={cn(
              "p-1.5 rounded-lg opacity-0 group-hover:opacity-100",
              "hover:bg-surface text-text-muted hover:text-text-primary",
              "transition-all duration-200",
              isHovered && "opacity-100"
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-semibold font-mono text-text-primary">
            {formatPrice(stock.price)}
          </span>
          <div
            className={cn(
              "flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-mono font-medium",
              stock.change >= 0
                ? "bg-accent-positive/15 text-accent-positive"
                : "bg-accent-negative/15 text-accent-negative"
            )}
          >
            {stock.change >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {formatPercent(stock.change)}
          </div>
        </div>

        {/* Mini chart placeholder */}
        <div className="mt-3 h-8 flex items-end gap-px">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-sm",
                stock.change >= 0 ? "bg-accent-positive/30" : "bg-accent-negative/30"
              )}
            />
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function WatchlistGrid({ onSelectStock, onRemoveStock }: WatchlistGridProps) {
  const [stocks, setStocks] = useState(initialStocks);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prev) =>
        prev.map((stock) => ({
          ...stock,
          price: stock.price + (Math.random() - 0.5) * 5,
          change: stock.change + (Math.random() - 0.5) * 0.1,
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRemove = (symbol: string) => {
    setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
    onRemoveStock?.(symbol);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary flex items-center gap-2">
          <Star className="w-4 h-4 text-accent-primary fill-accent-primary" />
          Watchlist
        </h2>
        <span className="text-xs text-text-muted">{stocks.length} stocks</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {stocks.map((stock, index) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              delay={index * 0.1}
              onClick={() => onSelectStock?.(stock)}
              onRemove={() => handleRemove(stock.symbol)}
            />
          ))}
        </AnimatePresence>

        {/* Add new stock placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: stocks.length * 0.1 }}
          className="flex items-center justify-center"
        >
          <GlassCard
            variant="interactive"
            className="p-4 w-full h-[160px] cursor-pointer flex flex-col items-center justify-center gap-2 border-dashed"
            onClick={() => onSelectStock?.({ symbol: "", name: "", price: 0, change: 0, volume: 0 })}
          >
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
              <span className="text-xl text-text-muted">+</span>
            </div>
            <span className="text-sm text-text-muted">Add Stock</span>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}