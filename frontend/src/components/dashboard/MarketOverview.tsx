"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn, formatVolume } from "@/lib/utils";

interface MarketData {
  nifty: number;
  niftyChange: number;
  volume: number;
  lastUpdate: string;
}

export function MarketOverview() {
  const [data, setData] = useState<MarketData>({
    nifty: 22450.0,
    niftyChange: 0.45,
    volume: 45200000,
    lastUpdate: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [sparklineHeights, setSparklineHeights] = useState<number[]>([]);

  // Generate sparkline heights only on client
  useEffect(() => {
    setSparklineHeights(Array.from({ length: 40 }, () => 20 + Math.random() * 80));
  }, []);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      setData((prev) => ({
        ...prev,
        nifty: prev.nifty + (Math.random() - 0.5) * 10,
        niftyChange: prev.niftyChange + (Math.random() - 0.5) * 0.1,
        lastUpdate: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }));
      setTimeout(() => setIsUpdating(false), 300);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard className="p-5" variant="elevated">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent-primary" />
          <span className="text-sm font-medium text-text-secondary">Market Overview</span>
        </div>
        <span className="text-xs text-text-muted">Last update: {data.lastUpdate}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* NIFTY 50 */}
        <motion.div
          key={data.nifty}
          initial={isUpdating ? { scale: 1.02 } : false}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="col-span-2"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold font-mono text-text-primary">
              {data.nifty.toFixed(2)}
            </span>
            <span className="text-xl font-mono text-text-secondary">NIFTY 50</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 mt-1",
              data.niftyChange >= 0 ? "text-accent-positive" : "text-accent-negative"
            )}
          >
            {data.niftyChange >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-mono font-medium">
              {data.niftyChange >= 0 ? "+" : ""}
              {data.niftyChange.toFixed(2)}%
            </span>
          </div>
        </motion.div>

        {/* Volume */}
        <div className="flex flex-col items-end justify-center">
          <div className="flex items-center gap-1 text-text-muted mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-xs">VOL</span>
          </div>
          <span className="text-xl font-mono font-medium text-text-secondary">
            {formatVolume(data.volume)}
          </span>
        </div>
      </div>

      {/* Mini sparkline indicator */}
      <div className="mt-4 h-10 flex items-end gap-0.5">
        {sparklineHeights.length > 0 ? sparklineHeights.map((height, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 0.3, delay: i * 0.02 }}
            className="flex-1 bg-accent-primary/30 rounded-sm"
          />
        )) : Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="flex-1 bg-accent-primary/30 rounded-sm" />
        ))}
      </div>
    </GlassCard>
  );
}