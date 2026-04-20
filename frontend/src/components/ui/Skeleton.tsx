"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={cn(
        "animate-shimmer bg-gradient-to-r from-surface-elevated via-divider to-surface-elevated bg-[length:200%_100%]",
        variantStyles[variant],
        className
      )}
      style={{
        width: width,
        height: height,
      }}
      role="status"
      aria-label="Loading content"
    />
  );
}

// Skeleton for cards
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 space-y-3", className)}>
      <Skeleton variant="text" width="40%" height={16} />
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="30%" height={14} />
    </div>
  );
}

// Skeleton for price display
export function SkeletonPrice({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton variant="text" width={80} height={32} />
      <Skeleton variant="text" width={60} height={16} />
    </div>
  );
}

// Skeleton for chart
export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-end gap-1 h-32">
        {Array.from({ length: 20 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width="100%"
            height={`${30 + Math.random() * 70}%`}
          />
        ))}
      </div>
      <Skeleton variant="text" width="100%" height={12} />
    </div>
  );
}