export type Symbol =
  | "BTCUSDT"
  | "ETHUSDT"
  | "SOLUSDT"
  | "DOGEUSDT";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "error"
  | "disconnected";

export type BinanceTrade = {
  e: "trade";
  s: Symbol;
  p: string;
};

export type BinanceCombinedMessage = {
  stream: string;
  data: BinanceTrade;
};

export type BinanceSubscriptionResponse = {
  result: null;
  id: number;
};

export type BinanceMessage =
  | BinanceCombinedMessage
  | BinanceSubscriptionResponse;