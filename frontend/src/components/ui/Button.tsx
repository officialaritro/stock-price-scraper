"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary:
        "bg-accent-primary text-background hover:bg-accent-primary/90 active:scale-[0.98]",
      secondary:
        "bg-surface-elevated text-text-primary hover:bg-surface-elevated/80 border border-divider active:scale-[0.98]",
      ghost:
        "text-text-secondary hover:text-text-primary hover:bg-surface/50 active:scale-[0.98]",
      danger:
        "bg-accent-negative text-white hover:bg-accent-negative/90 active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Simple motion button without complex type props
interface ButtonMotionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  whileTap?: { scale: number };
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const ButtonMotion = forwardRef<HTMLButtonElement, ButtonMotionProps>(
  ({ className, variant = "primary", size = "md", whileTap = { scale: 0.98 }, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary:
        "bg-accent-primary text-background hover:bg-accent-primary/90",
      secondary:
        "bg-surface-elevated text-text-primary hover:bg-surface-elevated/80 border border-divider",
      ghost:
        "text-text-secondary hover:text-text-primary hover:bg-surface/50",
      danger:
        "bg-accent-negative text-white hover:bg-accent-negative/90",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={whileTap}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

ButtonMotion.displayName = "ButtonMotion";

export { Button, ButtonMotion };