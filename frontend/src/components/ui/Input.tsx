"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-11 px-4 bg-surface-elevated/50 border border-divider rounded-xl",
              "text-text-primary placeholder:text-text-muted",
              "focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30",
              "transition-all duration-200",
              icon && "pl-10",
              error && "border-accent-negative focus:border-accent-negative focus:ring-accent-negative/30",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-accent-negative">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };