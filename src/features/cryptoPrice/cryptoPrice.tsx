import { useEffect, useRef, useState } from "react";
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

const STREAM_URL = "wss://stream.binance.com:9443/stream";

let requestId = 1;

const nextRequestId = () => requestId++;

export function CryptoPrice() {
  const [subscribedSymbols, setSubscribedSymbols] =
    useState<Symbol[]>(INITIAL_SYMBOLS);

  const subscribedSymbolsRef = useRef<Symbol[]>(INITIAL_SYMBOLS);

  const activeSubscriptionsRef = useRef<Set<Symbol>>(new Set(INITIAL_SYMBOLS));

  const [prices, setPrices] = useState<Partial<Record<Symbol, string>>>({});

  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [isConnected, setIsConnected] = useState(false);

  const clientRef = useRef<WebSocketClient | null>(null);

  const toggleSymbol = (symbol: Symbol) => {
    setSubscribedSymbols((currentSymbols) => {
      if (currentSymbols.includes(symbol)) {
        return currentSymbols.filter(
          (currentSymbol) => currentSymbol !== symbol,
        );
      }

      return [...currentSymbols, symbol];
    });
  };

  useEffect(() => {
    subscribedSymbolsRef.current = subscribedSymbols;
  }, [subscribedSymbols]);

  useEffect(() => {
    const client = new WebSocketClient(STREAM_URL);

    clientRef.current = client;

    client.onOpen(() => {
      setStatus("connected");
      setIsConnected(true);

      activeSubscriptionsRef.current.clear();

      const symbolsWithSub = subscribedSymbolsRef.current;

      client.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: symbolsWithSub.map(
            (symbol) => `${symbol.toLowerCase()}@trade`,
          ),
          id: nextRequestId(),
        }),
      );

      symbolsWithSub.forEach((symbol) => {
        activeSubscriptionsRef.current.add(symbol);
      });
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
      setIsConnected(false);
    });

    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, []);
  /*
  useEffect(() => {
    const activeSubscriptions = activeSubscriptionsRef.current;

    const desiredSubscriptions = new Set(subscribedSymbols);

    // Subscribe to newly requested symbols
    for (const symbol of desiredSubscriptions) {
      if (!activeSubscriptions.has(symbol)) {
        subscribe(symbol);
        activeSubscriptions.add(symbol);
      }
    }

    // Unsubscribe from symbols no longer requested
    for (const symbol of activeSubscriptions) {
      if (!desiredSubscriptions.has(symbol)) {
        unsubscribe(symbol);
        activeSubscriptions.delete(symbol);
      }
    }
  }, [subscribedSymbols]);
*/

  useEffect(() => {
    const client = clientRef.current;

    if (!client || !isConnected) {
      return;
    }

    const activeSubscriptions = activeSubscriptionsRef.current;

    const symbolsToSubscribe = subscribedSymbols.filter(
      (symbol) => !activeSubscriptions.has(symbol),
    );

    const symbolsToUnsubscribe = Array.from(activeSubscriptions).filter(
      (symbol) => !subscribedSymbols.includes(symbol),
    );

    if (symbolsToSubscribe.length > 0) {
      client.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: symbolsToSubscribe.map(
            (symbol) => `${symbol.toLowerCase()}@trade`,
          ),
          id: nextRequestId(),
        }),
      );
    }

    if (symbolsToUnsubscribe.length > 0) {
      client.send(
        JSON.stringify({
          method: "UNSUBSCRIBE",
          params: symbolsToUnsubscribe.map(
            (symbol) => `${symbol.toLowerCase()}@trade`,
          ),
          id: nextRequestId(),
        }),
      );
    }

    symbolsToSubscribe.forEach((symbol) => activeSubscriptions.add(symbol));

    symbolsToUnsubscribe.forEach((symbol) =>
      activeSubscriptions.delete(symbol),
    );
  }, [subscribedSymbols, isConnected]);

  return (
    <div>
      <h1>Crypto Prices</h1>
      <p>Status: {status}</p>
      <hr />

      <section>
        <h2>Symbols</h2>
        <ul>
          {AVAILABLE_SYMBOLS.map((symbol) => (
            <li key={symbol}>
              <label>
                <input
                  type="checkbox"
                  checked={subscribedSymbols.includes(symbol)}
                  onChange={() => toggleSymbol(symbol)}
                />

                {symbol}
              </label>
            </li>
          ))}
        </ul>
      </section>

      {subscribedSymbols.map((symbol) => (
        <PriceRow key={symbol} symbol={symbol} price={prices[symbol]} />
      ))}
    </div>
  );
}
