import "./cryptoPrices.css";

import { useEffect, useRef, useState } from "react";

import { AVAILABLE_SYMBOLS, INITIAL_SYMBOLS, STREAM_URL } from "./constants";
import type {
  BinanceMessage,
  ConnectionStatus,
  PriceData,
  PriceDirection,
  Symbol,
} from "./types";

import { BinanceSubscriptionManager } from "./binanceSubscriptionManager";
import { WebSocketClient } from "../../websocket/webSocketClient";
import { PriceRow } from "./priceRow";

export function CryptoPrices() {
  const [prices, setPrices] = useState<Partial<Record<Symbol, PriceData>>>({});
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

        setPrices((currentPrices) => {
          const previousPrice = currentPrices[symbol]?.price;

          const direction: PriceDirection =
            previousPrice === undefined
              ? "same"
              : Number(price) > Number(previousPrice)
                ? "up"
                : Number(price) < Number(previousPrice)
                  ? "down"
                  : "same";

          return {
            ...currentPrices,
            [symbol]: {
              price,
              direction,
            },
          };
        });

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

        subscriptionManager.handleError(message.id);
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
    <main className="crypto-prices">
      <header className="crypto-prices__header">
        <h1>Crypto Prices</h1>
        <p>
          Connection:{" "}
          <span className={`status status--${status}`}>{status}</span>
        </p>
      </header>

      <fieldset className="symbol-selector">
        <legend>Select cryptocurrencies</legend>

        <div className="symbol-selector__options">
          {AVAILABLE_SYMBOLS.map((symbol) => (
            <label key={symbol}>
              <input
                type="checkbox"
                checked={subscribedSymbols.includes(symbol)}
                onChange={() => toggleSymbol(symbol)}
              />
              <span>{symbol}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="price-table-wrapper">
        <table className="price-table">
          <caption>Live cryptocurrency prices</caption>

          <thead>
            <tr>
              <th scope="col">Symbol</th>
              <th scope="col">Price</th>
            </tr>
          </thead>

          <tbody>
            {subscribedSymbols.map((symbol) => (
              <PriceRow key={symbol} symbol={symbol} data={prices[symbol]} />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
