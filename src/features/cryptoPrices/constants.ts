import type { Symbol } from "./types";

export const AVAILABLE_SYMBOLS: Symbol[] = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "DOGEUSDT",
  "XRPUSDT",
  "BNBUSDT",
  "TRXUSDT",
];

export const INITIAL_SYMBOLS: Symbol[] = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

export const STREAM_URL = "wss://stream.binance.com:9443/stream";
