import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

interface ClientConnection {
  id: string;
  ws: WebSocket;
  userId?: string;
  sessionId?: string;
  lastActivity: Date;
  subscriptions: Set<string>;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  sessionId?: string;
  timestamp: string;
}

export class CustomWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private sessions: Map<string, Set<string>> = new Map(); // sessionId -> clientIds

  constructor() {
    this.setupHeartbeat();
  }

  initialize(server: any) {
    this.wss = new WebSocketServer({
      server,
      path: '/api/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('🚀 WebSocket server initialized');
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    // Add authentication logic here
    // For now, allow all connections in development
    return true;
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    const { query } = parse(request.url || '', true);
    const clientId = this.generateClientId();
    const sessionId = query.sessionId as string;
    const userId = query.userId as string;

    const client: ClientConnection = {
      id: clientId,
      ws,
      userId,
      sessionId,
      lastActivity: new Date(),
      subscriptions: new Set()
    };

    this.clients.set(clientId, client);

    // Add client to session
    if (sessionId) {
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, new Set());
      }
      this.sessions.get(sessionId)!.add(clientId);
    }

    console.log(`📡 Client connected: ${clientId} (session: ${sessionId})`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'welcome',
      payload: {
        clientId,
        sessionId,
        timestamp: new Date().toISOString()
      }
    });

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(clientId, message);
        client.lastActivity = new Date();
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        this.sendError(clientId, 'Invalid message format');
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`📨 Message from ${clientId}:`, message.type);

    switch (message.type) {
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          payload: { timestamp: new Date().toISOString() }
        });
        break;

      case 'subscribe':
        const { channels } = message.payload;
        if (Array.isArray(channels)) {
          channels.forEach(channel => client.subscriptions.add(channel));
          this.sendToClient(clientId, {
            type: 'subscribed',
            payload: { channels }
          });
        }
        break;

      case 'unsubscribe':
        const { channels: unsubChannels } = message.payload;
        if (Array.isArray(unsubChannels)) {
          unsubChannels.forEach(channel => client.subscriptions.delete(channel));
          this.sendToClient(clientId, {
            type: 'unsubscribed',
            payload: { channels: unsubChannels }
          });
        }
        break;

      case 'terminal_input':
        // Broadcast terminal input to session members
        this.broadcastToSession(client.sessionId, {
          type: 'terminal_output',
          payload: {
            sessionId: client.sessionId,
            input: message.payload.command,
            output: `Executing: ${message.payload.command}`,
            timestamp: new Date().toISOString()
          }
        }, clientId);
        break;

      case 'file_change':
        // Broadcast file changes to session members
        this.broadcastToSession(client.sessionId, {
          type: 'file_updated',
          payload: {
            file: message.payload.file,
            action: message.payload.action,
            timestamp: new Date().toISOString()
          }
        }, clientId);
        break;

      case 'cursor_position':
        // Broadcast cursor position for collaborative editing
        this.broadcastToSession(client.sessionId, {
          type: 'cursor_moved',
          payload: {
            userId: client.userId,
            position: message.payload.position,
            file: message.payload.file,
            timestamp: new Date().toISOString()
          }
        }, clientId);
        break;

      case 'chat_message':
        // Broadcast chat messages to session
        this.broadcastToSession(client.sessionId, {
          type: 'chat_received',
          payload: {
            userId: client.userId,
            message: message.payload.message,
            timestamp: new Date().toISOString()
          }
        });
        break;

      case 'session_join':
        // Handle session join
        const newSessionId = message.payload.sessionId;
        if (newSessionId && newSessionId !== client.sessionId) {
          // Remove from old session
          if (client.sessionId) {
            this.sessions.get(client.sessionId)?.delete(clientId);
          }
          
          // Add to new session
          client.sessionId = newSessionId;
          if (!this.sessions.has(newSessionId)) {
            this.sessions.set(newSessionId, new Set());
          }
          this.sessions.get(newSessionId)!.add(clientId);

          this.sendToClient(clientId, {
            type: 'session_joined',
            payload: { sessionId: newSessionId }
          });
        }
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
        this.sendError(clientId, `Unknown message type: ${message.type}`);
    }
  }

  private handleDisconnection(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`📡 Client disconnected: ${clientId}`);

    // Remove from session
    if (client.sessionId) {
      this.sessions.get(client.sessionId)?.delete(clientId);
      if (this.sessions.get(client.sessionId)?.size === 0) {
        this.sessions.delete(client.sessionId);
      }
    }

    // Remove client
    this.clients.delete(clientId);

    // Notify session members
    if (client.sessionId) {
      this.broadcastToSession(client.sessionId, {
        type: 'user_left',
        payload: {
          userId: client.userId,
          clientId,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  private sendToClient(clientId: string, message: Omit<WebSocketMessage, 'timestamp'>) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: new Date().toISOString()
      };
      
      client.ws.send(JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error);
      return false;
    }
  }

  private sendError(clientId: string, errorMessage: string) {
    this.sendToClient(clientId, {
      type: 'error',
      payload: { message: errorMessage }
    });
  }

  private broadcastToSession(sessionId: string | undefined, message: Omit<WebSocketMessage, 'timestamp'>, excludeClientId?: string) {
    if (!sessionId) return;

    const sessionClients = this.sessions.get(sessionId);
    if (!sessionClients) return;

    let sentCount = 0;
    sessionClients.forEach(clientId => {
      if (clientId !== excludeClientId) {
        if (this.sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    });

    console.log(`📡 Broadcast ${message.type} to ${sentCount} clients in session ${sessionId}`);
  }

  public broadcastToChannel(channel: string, message: Omit<WebSocketMessage, 'timestamp'>) {
    let sentCount = 0;
    
    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(channel)) {
        if (this.sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    });

    console.log(`📡 Broadcast ${message.type} to ${sentCount} clients on channel ${channel}`);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupHeartbeat() {
    setInterval(() => {
      const now = new Date();
      const timeout = 30000; // 30 seconds

      this.clients.forEach((client, clientId) => {
        if (now.getTime() - client.lastActivity.getTime() > timeout) {
          if (client.ws.readyState === WebSocket.OPEN) {
            // Send ping
            this.sendToClient(clientId, {
              type: 'ping',
              payload: {}
            });
          } else {
            // Remove dead connection
            this.handleDisconnection(clientId);
          }
        }
      });
    }, 15000); // Check every 15 seconds
  }

  public getStats() {
    return {
      connectedClients: this.clients.size,
      activeSessions: this.sessions.size,
      clients: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        userId: client.userId,
        sessionId: client.sessionId,
        subscriptions: Array.from(client.subscriptions),
        lastActivity: client.lastActivity
      }))
    };
  }
}

// Export singleton instance
export const wsServer = new CustomWebSocketServer();