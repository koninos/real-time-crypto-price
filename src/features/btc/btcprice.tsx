import { useEffect, useState } from "react";
import { WebSocketClient } from "../../websocket/webSocketClient";

type ConnectionStatus = "connecting" | "connected" | "error" | "disconnected";

type BinanceTradeMessage = {
  e: "trade";
  s: string;
  p: string;
};

const BTC_STREAM_URL = "wss://stream.binance.com:443/ws/btcusdt@trade";

export function BtcPrice() {
  const [price, setPrice] = useState<string | null>(null);

  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    const client = new WebSocketClient(BTC_STREAM_URL);

    client.onOpen(() => {
      setStatus("connected");
    });

    client.onMessage((event) => {
      const data: BinanceTradeMessage = JSON.parse(event.data);

      setPrice(data.p);
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
      <h2>BTC/USDT</h2>

      <p>Status: {status}</p>

      <p>Price: {price ?? "---"}</p>
    </div>
  );
}
