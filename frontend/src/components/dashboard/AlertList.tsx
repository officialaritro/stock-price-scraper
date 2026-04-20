"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, TrendingUp, TrendingDown, MoreHorizontal, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  symbol: string;
  type: "price_rise" | "price_drop" | "volume_spike";
  threshold: number;
  enabled: boolean;
  lastTriggered?: string;
}

interface AlertListProps {
  onEditAlert?: (alert: Alert) => void;
  onDeleteAlert?: (id: string) => void;
  onToggleAlert?: (id: string, enabled: boolean) => void;
}

// Initial alerts
const initialAlerts: Alert[] = [
  { id: "1", symbol: "RELIANCE", type: "price_drop", threshold: 2.0, enabled: true, lastTriggered: "2 days ago" },
  { id: "2", symbol: "HDFCBANK", type: "price_rise", threshold: 3.0, enabled: true },
  { id: "3", symbol: "INFY", type: "price_rise", threshold: 5.0, enabled: true, lastTriggered: "1 hour ago" },
  { id: "4", symbol: "TCS", type: "volume_spike", threshold: 50, enabled: false },
];

function AlertCard({
  alert,
  onEdit,
  onDelete,
  onToggle,
  delay,
}: {
  alert: Alert;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggle?: (enabled: boolean) => void;
  delay: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const typeConfig = {
    price_rise: { icon: TrendingUp, color: "text-accent-positive", bg: "bg-accent-positive/15", label: "Price Above" },
    price_drop: { icon: TrendingDown, color: "text-accent-negative", bg: "bg-accent-negative/15", label: "Price Below" },
    volume_spike: { icon: Bell, color: "text-accent-primary", bg: "bg-accent-primary/15", label: "Volume Spike" },
  };

  const config = typeConfig[alert.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlassCard
        variant="default"
        className={cn(
          "p-3.5 flex items-center gap-3 transition-all duration-200",
          !alert.enabled && "opacity-50"
        )}
      >
        {/* Icon */}
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
          <Icon className={cn("w-4.5 h-4.5", config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">{alert.symbol}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-surface text-text-muted">
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-muted">
              {alert.threshold}{alert.type === "volume_spike" ? "%" : "% change"}
            </span>
            {alert.lastTriggered && (
              <span className="text-xs text-text-muted">
                • Triggered {alert.lastTriggered}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle?.(!alert.enabled)}
            className={cn(
              "p-2 rounded-lg transition-colors duration-200",
              alert.enabled
                ? "text-accent-primary"
                : "text-text-muted hover:text-text-primary",
              "hover:bg-surface"
            )}
            aria-label={alert.enabled ? "Disable alert" : "Enable alert"}
          >
            {alert.enabled ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onDelete}
            className={cn(
              "p-2 rounded-lg opacity-0 hover:opacity-100 transition-all duration-200",
              "text-text-muted hover:text-accent-negative hover:bg-accent-negative/10",
              isHovered && "opacity-100"
            )}
            aria-label="Delete alert"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function AlertList({ onEditAlert, onDeleteAlert, onToggleAlert }: AlertListProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showAll, setShowAll] = useState(false);

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 3);
  const activeCount = alerts.filter((a) => a.enabled).length;

  const handleToggle = (id: string, enabled: boolean) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled } : a))
    );
    onToggleAlert?.(id, enabled);
  };

  const handleDelete = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    onDeleteAlert?.(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent-primary" />
          Alerts
        </h2>
        <span className="text-xs text-text-muted">
          {activeCount} active
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayedAlerts.map((alert, index) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              delay={index * 0.05}
              onToggle={(enabled) => handleToggle(alert.id, enabled)}
              onDelete={() => handleDelete(alert.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {alerts.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full"
        >
          {showAll ? "Show less" : `Show all (${alerts.length})`}
        </Button>
      )}
    </div>
  );
}