export type Symbol =
  | "BTCUSDT"
  | "ETHUSDT"
  | "SOLUSDT"
  | "DOGEUSDT"
  | "XRPUSDT"
  | "BNBUSDT"
  | "TRXUSDT";

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

export type BinanceError = {
  code: number;
  msg: string;
  id?: number;
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
  | BinanceSubscriptionResponse
  | BinanceError;

export type PendingRequest = {
  type: "subscribe" | "unsubscribe";
  symbols: Symbol[];
};

export type PriceDirection = "up" | "down" | "same";

export type PriceData = {
  price: string;
  direction: PriceDirection;
};
