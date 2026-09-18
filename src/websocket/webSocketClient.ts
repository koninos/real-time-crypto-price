type EventHandler = (event: Event) => void;
type MessageEventHandler = (event: MessageEvent) => void;
type CloseEventHandler = (event: CloseEvent) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private manuallyClosed = false;

  private handleOpen?: EventHandler;
  private handleMessage?: MessageEventHandler;
  private handleError?: EventHandler;
  private handleClose?: CloseEventHandler;

  get isConnected(): boolean {
  return this.ws?.readyState === WebSocket.OPEN;
}

  constructor(private readonly url: string) {}

  connect(): void {
    if (this.ws) {
      return;
    }
    
    this.manuallyClosed = false;
    
    this.ws = new WebSocket(this.url);

    this.ws.onopen = (event) => {
      this.handleOpen?.(event);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage?.(event);
    };

    this.ws.onerror = (event) => {
      this.handleError?.(event);
    };

    this.ws.onclose = (event) => {
      this.handleClose?.(event);
      this.ws = null;

      if (!this.manuallyClosed) {
        setTimeout(() => {
          this.connect();
        }, 1000);
      }
    };
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.ws?.close();
  }

  send(message: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    this.ws.send(message);
  }

  onOpen(handler: EventHandler): void {
    this.handleOpen = handler;
  }

  onMessage(handler: MessageEventHandler): void {
    this.handleMessage = handler;
  }

  onError(handler: EventHandler): void {
    this.handleError = handler;
  }

  onClose(handler: CloseEventHandler): void {
    this.handleClose = handler;
  }
}