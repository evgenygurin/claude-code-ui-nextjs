'use client';

interface WebSocketMessage {
  type: string;
  payload: any;
  sessionId?: string;
  timestamp: string;
}

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private sessionId?: string;
  private userId?: string;

  constructor(sessionId?: string, userId?: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws`;
        
        const params = new URLSearchParams();
        if (this.sessionId) params.append('sessionId', this.sessionId);
        if (this.userId) params.append('userId', this.userId);
        
        const fullUrl = `${wsUrl}?${params.toString()}`;
        
        this.ws = new WebSocket(fullUrl);

        this.ws.onopen = () => {
          console.log('🚀 WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.notifyConnectionHandlers(false);

          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  send(type: string, payload: any, sessionId?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }

    try {
      const message: Omit<WebSocketMessage, 'timestamp'> = {
        type,
        payload,
        sessionId: sessionId || this.sessionId
      };

      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  // Message subscription methods
  subscribe(messageType: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    this.messageHandlers.get(messageType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(messageType)?.delete(handler);
    };
  }

  unsubscribe(messageType: string, handler?: MessageHandler) {
    if (handler) {
      this.messageHandlers.get(messageType)?.delete(handler);
    } else {
      this.messageHandlers.delete(messageType);
    }
  }

  // Connection status subscription
  onConnectionChange(handler: ConnectionHandler) {
    this.connectionHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  // Convenience methods for common operations
  joinSession(sessionId: string) {
    this.sessionId = sessionId;
    return this.send('session_join', { sessionId });
  }

  subscribeToChannel(channels: string[]) {
    return this.send('subscribe', { channels });
  }

  unsubscribeFromChannel(channels: string[]) {
    return this.send('unsubscribe', { channels });
  }

  sendTerminalInput(command: string, sessionId?: string) {
    return this.send('terminal_input', { command }, sessionId);
  }

  sendFileChange(file: string, action: string, content?: string) {
    return this.send('file_change', { file, action, content });
  }

  sendCursorPosition(file: string, position: { line: number; column: number }) {
    return this.send('cursor_position', { file, position });
  }

  sendChatMessage(message: string) {
    return this.send('chat_message', { message });
  }

  ping() {
    return this.send('ping', {});
  }

  // Status getters
  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState() {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('📨 WebSocket message:', message.type);

    // Handle system messages
    switch (message.type) {
      case 'welcome':
        console.log('✅ WebSocket welcome received');
        break;
      case 'error':
        console.error('❌ WebSocket error:', message.payload.message);
        break;
      case 'pong':
        // Handle ping response
        break;
    }

    // Notify type-specific handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${message.type}:`, error);
        }
      });
    }
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}`);
        this.connect().catch(error => {
          console.error('Reconnect failed:', error);
        });
      }
    }, delay);
  }
}

// React hook for easy WebSocket usage
export function useWebSocket(sessionId?: string, userId?: string) {
  const wsRef = React.useRef<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState<string>('disconnected');

  React.useEffect(() => {
    wsRef.current = new WebSocketClient(sessionId, userId);
    
    const unsubscribe = wsRef.current.onConnectionChange((connected) => {
      setIsConnected(connected);
      setConnectionState(wsRef.current?.connectionState || 'disconnected');
    });

    wsRef.current.connect().catch(console.error);

    return () => {
      unsubscribe();
      wsRef.current?.disconnect();
    };
  }, [sessionId, userId]);

  const send = React.useCallback((type: string, payload: any, sessionId?: string) => {
    return wsRef.current?.send(type, payload, sessionId) || false;
  }, []);

  const subscribe = React.useCallback((messageType: string, handler: MessageHandler) => {
    return wsRef.current?.subscribe(messageType, handler) || (() => {});
  }, []);

  return {
    ws: wsRef.current,
    isConnected,
    connectionState,
    send,
    subscribe,
    joinSession: React.useCallback((sessionId: string) => wsRef.current?.joinSession(sessionId), []),
    sendTerminalInput: React.useCallback((command: string, sessionId?: string) => 
      wsRef.current?.sendTerminalInput(command, sessionId), []),
    sendFileChange: React.useCallback((file: string, action: string, content?: string) => 
      wsRef.current?.sendFileChange(file, action, content), []),
    sendChatMessage: React.useCallback((message: string) => 
      wsRef.current?.sendChatMessage(message), [])
  };
}

// Global WebSocket client instance
let globalWebSocketClient: WebSocketClient | null = null;

export function getGlobalWebSocketClient(sessionId?: string, userId?: string): WebSocketClient {
  if (!globalWebSocketClient) {
    globalWebSocketClient = new WebSocketClient(sessionId, userId);
  }
  return globalWebSocketClient;
}