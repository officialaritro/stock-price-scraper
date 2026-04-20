"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
  glowOnHover?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glowOnHover = false, children, ...props }, ref) => {
    const baseStyles =
      "relative rounded-2xl border border-white/[0.06] backdrop-blur-xl overflow-hidden transition-all duration-300";

    const variantStyles = {
      default: "bg-surface/60",
      elevated: "bg-surface-elevated/80",
      interactive:
        "bg-surface/60 hover:bg-surface-elevated/80 cursor-pointer active:scale-[0.98]",
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Glow effect on hover */}
        {glowOnHover && (
          <div className="absolute inset-0 rounded-2xl bg-accent-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

// Motion variant with animation
interface GlassCardMotionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "interactive";
  glowOnHover?: boolean;
  delay?: number;
}

const GlassCardMotion = forwardRef<HTMLDivElement, GlassCardMotionProps>(
  ({ className, variant = "default", glowOnHover = false, delay = 0, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        {...props}
      >
        <GlassCard className={className} variant={variant} glowOnHover={glowOnHover}>
          {children}
        </GlassCard>
      </motion.div>
    );
  }
);

GlassCardMotion.displayName = "GlassCardMotion";

export { GlassCard, GlassCardMotion };