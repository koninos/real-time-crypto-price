import { useEffect, useRef, useState } from "react";

import { AVAILABLE_SYMBOLS, INITIAL_SYMBOLS, STREAM_URL } from "./constants";
import type { BinanceMessage, ConnectionStatus, Symbol } from "./types";

import { BinanceSubscriptionManager } from "./binanceSubscriptionManager";
import { WebSocketClient } from "../../websocket/webSocketClient";
import { PriceRow } from "./priceRow";

export function CryptoPrices() {
  const [prices, setPrices] = useState<Partial<Record<Symbol, string>>>({});

  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  const [subscribedSymbols, setSubscribedSymbols] =
    useState<Symbol[]>(INITIAL_SYMBOLS);

  const [isConnected, setIsConnected] = useState(false);

  const subscriptionManagerRef = useRef<BinanceSubscriptionManager | null>(
    null,
  );

  const subscribedSymbolsRef = useRef<Symbol[]>(INITIAL_SYMBOLS);

  useEffect(() => {
    subscribedSymbolsRef.current = subscribedSymbols;
  }, [subscribedSymbols]);

  useEffect(() => {
    const client = new WebSocketClient(STREAM_URL);

    const subscriptionManager = new BinanceSubscriptionManager(client);

    subscriptionManagerRef.current = subscriptionManager;

    client.onOpen(() => {
      setStatus("connected");
      setIsConnected(true);

      subscriptionManager.onConnected(subscribedSymbolsRef.current);
    });

    client.onMessage((event) => {
      const message: BinanceMessage = JSON.parse(event.data);

      if ("data" in message) {
        const { s: symbol, p: price } = message.data;

        setPrices((currentPrices) => ({
          ...currentPrices,
          [symbol]: price,
        }));

        return;
      }

      if ("result" in message) {
        subscriptionManager.handleResponse(
          message.id,
          subscribedSymbolsRef.current,
        );

        return;
      }

      if ("code" in message) {
        console.error("Binance request failed:", message);
      }
    });

    client.onError(() => {
      setStatus("error");
    });

    client.onClose(() => {
      setStatus("disconnected");
      setIsConnected(false);

      subscriptionManager.reset();
    });

    client.connect();

    return () => {
      client.disconnect();
      subscriptionManager.reset();

      subscriptionManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const subscriptionManager = subscriptionManagerRef.current;

    if (!subscriptionManager || !isConnected) {
      return;
    }

    subscriptionManager.synchronize(subscribedSymbols);
  }, [subscribedSymbols, isConnected]);

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
