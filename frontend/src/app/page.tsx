"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Header } from "@/components/layout/Header";
import { SearchBar } from "@/components/layout/SearchBar";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { WatchlistGrid } from "@/components/dashboard/WatchlistGrid";
import { AlertList } from "@/components/dashboard/AlertList";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { AddStockModal } from "@/components/modals/AddStockModal";
import { AlertConfigModal } from "@/components/modals/AlertConfigModal";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
}

export default function DashboardPage() {
  const [selectedStock, setSelectedStock] = useState("RELIANCE");
  const [showAddStock, setShowAddStock] = useState(false);
  const [showAlertConfig, setShowAlertConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock.symbol);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with search (mobile) */}
      <Header onAddStock={() => setShowAddStock(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Mobile Search */}
        <div className="md:hidden">
          <SearchBar onSelect={handleSelectStock} />
        </div>

        {/* Market Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MarketOverview />
        </motion.section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Watchlist */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <WatchlistGrid onSelectStock={handleSelectStock} />
          </motion.div>

          {/* Right Column - Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlassCard className="p-5">
              <AlertList
                onEditAlert={(alert) => {
                  setSelectedStock(alert.symbol);
                  setShowAlertConfig(true);
                }}
              />
            </GlassCard>
          </motion.div>
        </div>

        {/* Price Chart */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PriceChart symbol={selectedStock} />
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassCard
              variant="interactive"
              glowOnHover
              className="p-5 cursor-pointer"
              onClick={() => setShowAddStock(true)}
            >
              <div className="text-center">
                <p className="text-2xl mb-1">+</p>
                <p className="text-sm text-text-secondary">Add Stock</p>
              </div>
            </GlassCard>
            <GlassCard
              variant="interactive"
              glowOnHover
              className="p-5 cursor-pointer"
              onClick={() => setShowAlertConfig(true)}
            >
              <div className="text-center">
                <p className="text-2xl mb-1">!</p>
                <p className="text-sm text-text-secondary">Create Alert</p>
              </div>
            </GlassCard>
            <GlassCard
              variant="interactive"
              glowOnHover
              className="p-5 cursor-pointer"
            >
              <div className="text-center">
                <p className="text-2xl mb-1">↻</p>
                <p className="text-sm text-text-secondary">Refresh Data</p>
              </div>
            </GlassCard>
          </div>
        </motion.section>

        {/* Data Source Info */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center py-4"
        >
          <p className="text-xs text-text-muted">
            Data sourced from NSE India • Updated every 15 minutes •{" "}
            <button className="text-accent-primary hover:underline">
              Manual refresh
            </button>
          </p>
        </motion.footer>
      </main>

      {/* Modals */}
      <AddStockModal
        isOpen={showAddStock}
        onClose={() => setShowAddStock(false)}
        onAdd={(stock) => {
          handleSelectStock(stock);
        }}
      />

      <AlertConfigModal
        isOpen={showAlertConfig}
        onClose={() => setShowAlertConfig(false)}
        symbol={selectedStock}
        onSave={(config) => {
          console.log("Alert saved:", config);
        }}
      />
    </div>
  );
}