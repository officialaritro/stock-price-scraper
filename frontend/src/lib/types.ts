export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
}

export interface Alert {
  id: string;
  symbol: string;
  type: "price_rise" | "price_drop" | "volume_spike";
  threshold: number;
  enabled: boolean;
  lastTriggered?: string;
}

export interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  nifty: number;
  niftyChange: number;
  volume: number;
  lastUpdate: string;
}