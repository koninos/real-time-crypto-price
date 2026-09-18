import type { WebSocketClient } from "../../websocket/webSocketClient";
import { subscribe, unsubscribe } from "./binanceService";
import type { PendingRequest, Symbol } from "./types";

export class BinanceSubscriptionManager {
  private readonly activeSubscriptions = new Set<Symbol>();

  private readonly pendingRequests = new Map<number, PendingRequest>();

  private requestId = 1;

  constructor(private readonly client: WebSocketClient) {}

  synchronize(desiredSymbols: Symbol[]): void {
    if (!this.client.isConnected) {
      return;
    }

    const symbolsToSubscribe = desiredSymbols.filter(
      (symbol) =>
        !this.activeSubscriptions.has(symbol) &&
        !this.hasPendingRequest(symbol),
    );

    const symbolsToUnsubscribe = Array.from(this.activeSubscriptions).filter(
      (symbol) =>
        !desiredSymbols.includes(symbol) && !this.hasPendingRequest(symbol),
    );

    if (symbolsToSubscribe.length > 0) {
      this.sendSubscribe(symbolsToSubscribe);
    }

    if (symbolsToUnsubscribe.length > 0) {
      this.sendUnsubscribe(symbolsToUnsubscribe);
    }
  }

  handleResponse(id: number, desiredSymbols: Symbol[]): void {
    const pendingRequest = this.pendingRequests.get(id);

    if (!pendingRequest) {
      return;
    }

    if (pendingRequest.type === "subscribe") {
      pendingRequest.symbols.forEach((symbol) => {
        this.activeSubscriptions.add(symbol);
      });
    } else {
      pendingRequest.symbols.forEach((symbol) => {
        this.activeSubscriptions.delete(symbol);
      });
    }

    this.pendingRequests.delete(id);

    this.synchronize(desiredSymbols);
  }

  handleError(id?: number): void {
    if (id === undefined) {
      return;
    }

    this.pendingRequests.delete(id);
  }

  onConnected(desiredSymbols: Symbol[]): void {
    this.reset();
    this.synchronize(desiredSymbols);
  }

  reset(): void {
    this.activeSubscriptions.clear();
    this.pendingRequests.clear();
  }

  private sendSubscribe(symbols: Symbol[]): void {
    const requestId = this.requestId++;

    this.pendingRequests.set(requestId, {
      type: "subscribe",
      symbols,
    });

    subscribe(this.client, symbols, requestId);
  }

  private sendUnsubscribe(symbols: Symbol[]): void {
    const requestId = this.requestId++;

    this.pendingRequests.set(requestId, {
      type: "unsubscribe",
      symbols,
    });

    unsubscribe(this.client, symbols, requestId);
  }

  private hasPendingRequest(symbol: Symbol): boolean {
    return Array.from(this.pendingRequests.values()).some((request) =>
      request.symbols.includes(symbol),
    );
  }
}
