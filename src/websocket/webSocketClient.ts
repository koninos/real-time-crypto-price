export class WebSocketClient {
  private ws: WebSocket | null = null;

  constructor(private readonly url: string) {}

  connect(): void {
    if (this.ws) {
      return;
    }

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
    };
  }

  disconnect(): void {
    this.ws?.close();
  }

  private handleOpen?: (event: Event) => void;
  private handleMessage?: (event: MessageEvent) => void;
  private handleError?: (event: Event) => void;
  private handleClose?: (event: CloseEvent) => void;

  onOpen(handler: (event: Event) => void): void {
    this.handleOpen = handler;
  }

  onMessage(handler: (event: MessageEvent) => void): void {
    this.handleMessage = handler;
  }

  onError(handler: (event: Event) => void): void {
    this.handleError = handler;
  }

  onClose(handler: (event: CloseEvent) => void): void {
    this.handleClose = handler;
  }
}