import { useEffect, useState } from "react";
import { WebSocketClient } from "../../websocket/webSocketClient";

type ConnectionStatus = "connecting" | "connected" | "error" | "disconnected";

type BinanceTrade = {
  e: "trade";
  s: string;
  p: string;
};

type BinanceCombinedMessage = {
  stream: string;
  data: BinanceTrade;
};

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;

const STREAM_URL = `wss://stream.binance.com:9443/stream?streams=${SYMBOLS.map(
  (symbol) => `${symbol.toLowerCase()}@trade`,
).join("/")}`;

export function BtcPrice() {
  const [prices, setPrices] = useState<Record<string, string>>({});

  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    const client = new WebSocketClient(STREAM_URL);

    client.onOpen(() => {
      setStatus("connected");
    });

    client.onMessage((event) => {
      const message: BinanceCombinedMessage = JSON.parse(event.data);

      const { s: symbol, p: price } = message.data;

      setPrices((currentPrices) => ({
        ...currentPrices,
        [symbol]: price,
      }));
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

      {SYMBOLS.map((symbol) => (
        <p key={symbol}>
          {symbol}: {prices[symbol] ?? "---"}
        </p>
      ))}
    </div>
  );
}
