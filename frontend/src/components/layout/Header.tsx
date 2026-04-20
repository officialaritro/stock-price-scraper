"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, Settings, X, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  onAddStock?: () => void;
  onSettings?: () => void;
}

export function Header({ onAddStock, onSettings }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications
  const notifications = [
    { id: 1, type: "alert", message: "RELIANCE dropped 2.1%", time: "2 min ago" },
    { id: 2, type: "price", message: "TCS updated to ₹3,250", time: "15 min ago" },
  ];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    console.log("Search:", searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-accent-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent-primary" />
            </div>
            <span className="text-xl font-semibold text-text-primary">
              Stock<span className="text-accent-primary">Spy</span>
            </span>
          </motion.div>

          {/* Search */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex flex-1 max-w-md mx-8"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search stocks..."
                className={cn(
                  "w-full h-10 pl-10 pr-4 bg-surface/50 border border-divider rounded-xl",
                  "text-sm text-text-primary placeholder:text-text-muted",
                  "focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20",
                  "transition-all duration-200"
                )}
              />
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 w-full bg-surface-elevated border border-divider rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-2 text-sm text-text-muted">
                    Type to search NSE stocks...
                  </div>
                </motion.div>
              )}
            </div>
          </motion.form>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            {/* Add Stock Button */}
            <Button onClick={onAddStock} size="sm" className="hidden sm:flex">
              <span className="mr-1">+</span> Add Stock
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-negative rounded-full" />
              </Button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-surface-elevated border border-divider rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="p-3 border-b border-divider">
                      <h3 className="font-medium text-text-primary">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3 hover:bg-surface/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                notif.type === "alert"
                                  ? "bg-accent-negative/20"
                                  : "bg-accent-positive/20"
                              )}
                            >
                              {notif.type === "alert" ? (
                                <TrendingDown className="w-4 h-4 text-accent-negative" />
                              ) : (
                                <TrendingUp className="w-4 h-4 text-accent-positive" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary truncate">
                                {notif.message}
                              </p>
                              <p className="text-xs text-text-muted mt-0.5">
                                {notif.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Settings */}
            <Button variant="ghost" size="sm" onClick={onSettings} aria-label="Settings">
              <Settings className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  );
}