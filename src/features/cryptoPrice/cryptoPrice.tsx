import { useEffect, useState } from "react";
import { WebSocketClient } from "../../websocket/webSocketClient";
import { PriceRow } from "./priceRow";

type ConnectionStatus = "connecting" | "connected" | "error" | "disconnected";

type BinanceTrade = {
  e: "trade";
  s: Symbol;
  p: string;
};

type BinanceCombinedMessage = {
  stream: string;
  data: BinanceTrade;
};

type BinanceSubscriptionResponse = {
  result: null;
  id: number;
};

type BinanceMessage = BinanceCombinedMessage | BinanceSubscriptionResponse;

const AVAILABLE_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "DOGEUSDT",
] as const;

type Symbol = (typeof AVAILABLE_SYMBOLS)[number];

const INITIAL_SYMBOLS: Symbol[] = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

const STREAM_URL = `wss://stream.binance.com:9443/stream?streams=${INITIAL_SYMBOLS.map(
  (symbol) => `${symbol.toLowerCase()}@trade`,
).join("/")}`;

export function CryptoPrice() {
  const [prices, setPrices] = useState<Partial<Record<Symbol, string>>>({});

  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    const client = new WebSocketClient(STREAM_URL);

    client.onOpen(() => {
      setStatus("connected");

      client.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: ["dogeusdt@trade"],
          id: 1,
        }),
      );
    });

    client.onMessage((event) => {
      const message: BinanceMessage = JSON.parse(event.data);

      if ("data" in message) {
        const { s: symbol, p: price } = message.data;

        setPrices((currentPrices) => ({
          ...currentPrices,
          [symbol]: price,
        }));
      }
    });

    client.onError(() => {
      setStatus("error");
    });

    client.onClose(() => {
      setStatus("disconnected");
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Crypto Prices</h2>
      <p>Status: {status}</p>

      {AVAILABLE_SYMBOLS.map((symbol) => (
        <PriceRow key={symbol} symbol={symbol} price={prices[symbol]} />
      ))}
    </div>
  );
}
