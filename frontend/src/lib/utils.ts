import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatVolume(volume: number): string {
  if (volume >= 10000000) {
    return `${(volume / 10000000).toFixed(1)}M`;
  }
  if (volume >= 100000) {
    return `${(volume / 100000).toFixed(1)}L`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
}

export function formatCompactPrice(price: number): string {
  if (price >= 10000000) {
    return `${(price / 10000000).toFixed(2)}Cr`;
  }
  if (price >= 100000) {
    return `${(price / 100000).toFixed(2)}L`;
  }
  return price.toFixed(2);
}