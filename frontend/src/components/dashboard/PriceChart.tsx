"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn, formatPrice } from "@/lib/utils";

interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceChartProps {
  data?: PricePoint[];
  symbol?: string;
}

// Generate mock data
function generateMockData(days: number = 30): PricePoint[] {
  const data: PricePoint[] = [];
  let basePrice = 2400;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const change = (Math.random() - 0.5) * 50;
    basePrice = Math.max(1000, basePrice + change);

    const high = basePrice + Math.random() * 20;
    const low = basePrice - Math.random() * 20;
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);

    data.push({
      timestamp: date.toISOString().split("T")[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(5000000 + Math.random() * 15000000),
    });
  }

  return data;
}

const timeRanges = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
];

export function PriceChart({ symbol = "RELIANCE" }: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState("1M");
  const [data, setData] = useState<PricePoint[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate data only on client after hydration
  useEffect(() => {
    setData(generateMockData(30));
    setIsLoaded(true);
  }, []);

  const currentPrice = data[data.length - 1]?.close || 0;
  const firstPrice = data[0]?.close || 0;
  const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100;

  return (
    <GlassCard className="p-5" variant="elevated">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-medium text-text-primary">{symbol}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xl font-semibold font-mono text-text-primary">
              {formatPrice(currentPrice)}
            </span>
            <span
              className={cn(
                "text-sm font-mono",
                priceChange >= 0 ? "text-accent-positive" : "text-accent-negative"
              )}
            >
              {priceChange >= 0 ? "+" : ""}
              {priceChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 p-1 bg-surface/50 rounded-lg">
          {timeRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => setSelectedRange(range.label)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                selectedRange === range.label
                  ? "bg-accent-primary text-background"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80">
        {!isLoaded || data.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse text-text-muted">Loading chart...</div>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#2DD4BF"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="#2DD4BF"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(51, 51, 58, 0.5)"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 10 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={["dataMin - 50", "dataMax + 50"]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 10 }}
              tickFormatter={(value) => `₹${value}`}
              width={60}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-surface-elevated border border-divider rounded-lg p-3 shadow-xl"
                    >
                      <p className="text-xs text-text-muted mb-2">
                        {new Date(label).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm text-text-primary">
                          <span className="text-text-muted">Open: </span>
                          <span className="font-mono">₹{data.open}</span>
                        </p>
                        <p className="text-sm text-text-primary">
                          <span className="text-text-muted">High: </span>
                          <span className="font-mono">₹{data.high}</span>
                        </p>
                        <p className="text-sm text-text-primary">
                          <span className="text-text-muted">Low: </span>
                          <span className="font-mono">₹{data.low}</span>
                        </p>
                        <p className="text-sm text-accent-primary">
                          <span className="text-text-muted">Close: </span>
                          <span className="font-mono">₹{data.close}</span>
                        </p>
                      </div>
                    </motion.div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#2DD4BF"
              strokeWidth={2}
              fill="url(#priceGradient)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
}