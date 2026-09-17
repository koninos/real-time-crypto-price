import { useEffect, useRef, useState } from "react";
import { WebSocketClient } from "../../websocket/webSocketClient";
import { PriceRow } from "./priceRow";
import type { BinanceMessage, ConnectionStatus, Symbol } from "./types";
import { AVAILABLE_SYMBOLS, INITIAL_SYMBOLS, STREAM_URL } from "./constants";
import { subscribe, unsubscribe } from "./binanceService";

let requestId = 1;

const nextRequestId = () => requestId++;

export function CryptoPrices() {
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

      if (symbolsWithSub.length === 0) {
        return;
      }

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

    subscribe(client, symbolsToSubscribe, nextRequestId());

    unsubscribe(client, symbolsToUnsubscribe, nextRequestId());

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
