"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, TrendingUp, TrendingDown, Bell, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface AlertConfig {
  symbol: string;
  type: "price_rise" | "price_drop" | "volume_spike";
  threshold: number;
  enabled: boolean;
}

interface AlertConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol?: string;
  onSave?: (config: AlertConfig) => void;
}

const alertTypes = [
  {
    id: "price_rise" as const,
    label: "Price Rises Above",
    icon: TrendingUp,
    color: "text-accent-positive",
    bg: "bg-accent-positive/15",
    description: "Notify when price goes above threshold",
  },
  {
    id: "price_drop" as const,
    label: "Price Drops Below",
    icon: TrendingDown,
    color: "text-accent-negative",
    bg: "bg-accent-negative/15",
    description: "Notify when price falls below threshold",
  },
  {
    id: "volume_spike" as const,
    label: "Volume Spike",
    icon: Bell,
    color: "text-accent-primary",
    bg: "bg-accent-primary/15",
    description: "Notify when volume increases by threshold",
  },
];

export function AlertConfigModal({ isOpen, onClose, symbol = "RELIANCE", onSave }: AlertConfigModalProps) {
  const [selectedType, setSelectedType] = useState<AlertConfig["type"]>("price_drop");
  const [threshold, setThreshold] = useState("2.0");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum <= 0) {
      setError("Please enter a valid threshold value");
      return;
    }

    if (selectedType === "volume_spike" && thresholdNum > 100) {
      setError("Volume threshold cannot exceed 100%");
      return;
    }

    onSave?.({
      symbol,
      type: selectedType,
      threshold: thresholdNum,
      enabled: true,
    });

    setThreshold("2.0");
    setError("");
    onClose();
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
                <AlertTriangle className="w-4 h-4 text-accent-primary" />
                Create Alert
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Symbol */}
              <div className="p-4 border-b border-divider">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Stock</span>
                  <span className="text-lg font-semibold text-text-primary">{symbol}</span>
                </div>
              </div>

              {/* Alert Type Selection */}
              <div className="p-4 border-b border-divider space-y-3">
                <label className="text-sm text-text-secondary">Alert Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {alertTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={cn(
                          "p-3 rounded-xl flex items-center gap-3 transition-all duration-200 border",
                          selectedType === type.id
                            ? `${type.bg} border-${type.id === "price_rise" ? "accent-positive" : type.id === "price_drop" ? "accent-negative" : "accent-primary"}/30`
                            : "border-divider hover:bg-surface/50",
                          "text-left"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", type.bg)}>
                          <Icon className={cn("w-5 h-5", type.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{type.label}</p>
                          <p className="text-xs text-text-muted">{type.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Threshold Input */}
              <div className="p-4 border-b border-divider">
                <Input
                  label="Threshold"
                  type="number"
                  step="0.1"
                  min="0"
                  max={selectedType === "volume_spike" ? "100" : "50"}
                  value={threshold}
                  onChange={(e) => {
                    setThreshold(e.target.value);
                    setError("");
                  }}
                  error={error}
                  icon={
                    <span className="text-xs text-text-muted font-medium">
                      {selectedType === "volume_spike" ? "%" : "%"}
                    </span>
                  }
                />
                <p className="text-xs text-text-muted mt-2">
                  {selectedType === "price_rise"
                    ? "Alert when price rises by this percentage"
                    : selectedType === "price_drop"
                    ? "Alert when price drops by this percentage"
                    : "Alert when volume is this percentage higher than 30-day average"}
                </p>
              </div>

              {/* Preview */}
              <div className="p-4">
                <div className="p-3 rounded-xl bg-surface/50">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Alert Preview</p>
                  <p className="text-sm text-text-primary">
                    Notify me when {symbol} {selectedType === "price_rise" ? "rises" : selectedType === "price_drop" ? "drops" : "volume spikes"} by {threshold}
                    {selectedType !== "volume_spike" ? "%" : "%"}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-divider flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create Alert
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}