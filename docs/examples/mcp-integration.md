# MCP Integration Examples

This guide demonstrates how to integrate Claude Code UI with MCP (Model Context Protocol) servers for enhanced functionality.

## Overview

MCP (Model Context Protocol) allows Claude Code UI to connect to external tools and services, expanding its capabilities beyond the basic chat interface.

## Example 1: File System MCP Server

### Setup

First, install and configure a file system MCP server:

```bash
# Install MCP server for file operations
npm install -g @anthropic/mcp-server-filesystem

# Or clone and build from source
git clone https://github.com/anthropic/mcp-servers.git
cd mcp-servers/src/filesystem
npm install && npm run build
```

### Configuration

Add MCP server configuration to your environment:

```bash
# .env
MCP_SERVER_URL=http://localhost:8000
MCP_SERVER_TOKEN=your-mcp-token-here
```

### Usage Example

```typescript
// In your component
import { useMCP } from '@/lib/mcp-client';

export function FileOperationsComponent() {
  const { mcpClient, isConnected } = useMCP();

  const readFileContent = async (filePath: string) => {
    if (!mcpClient) return;

    const result = await mcpClient.callTool('read_file', {
      path: filePath
    });
    
    return result.content;
  };

  const listDirectory = async (dirPath: string) => {
    if (!mcpClient) return;

    const result = await mcpClient.callTool('list_directory', {
      path: dirPath
    });
    
    return result.files;
  };

  return (
    <div>
      <p>MCP Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {/* Your file operations UI */}
    </div>
  );
}
```

## Example 2: Git Integration MCP Server

### Setup Git MCP Server

```bash
# Install Git MCP server
npm install -g @anthropic/mcp-server-git
```

### Configuration

```bash
# .env
GIT_MCP_SERVER_URL=http://localhost:8001
GIT_MCP_TOKEN=your-git-mcp-token
```

### Usage in Components

```typescript
import { useWebSocket } from '@/lib/websocket-client';

export function GitIntegration() {
  const { send, subscribe } = useWebSocket();

  React.useEffect(() => {
    // Subscribe to git events
    const unsubscribe = subscribe('git_status', (message) => {
      console.log('Git status update:', message.payload);
    });

    return unsubscribe;
  }, [subscribe]);

  const getGitStatus = async () => {
    // Use MCP to get git status
    send('mcp_call', {
      server: 'git',
      tool: 'git_status',
      args: { path: process.cwd() }
    });
  };

  const commitChanges = async (message: string) => {
    send('mcp_call', {
      server: 'git',
      tool: 'git_commit',
      args: { message, path: process.cwd() }
    });
  };

  return (
    <div className="git-integration">
      <button onClick={getGitStatus}>
        Check Git Status
      </button>
      <button onClick={() => commitChanges('Auto commit via MCP')}>
        Commit Changes
      </button>
    </div>
  );
}
```

## Example 3: Database MCP Server

### Setup Database Integration

```bash
# Install database MCP server
npm install -g @anthropic/mcp-server-database
```

### Configuration

```bash
# .env
DATABASE_MCP_URL=http://localhost:8002
DATABASE_CONNECTION_STRING=postgresql://user:pass@localhost:5432/mydb
```

### Usage Example

```typescript
export function DatabaseQueryComponent() {
  const [queryResult, setQueryResult] = useState(null);
  const { mcpClient } = useMCP();

  const executeQuery = async (sql: string) => {
    try {
      const result = await mcpClient.callTool('execute_query', {
        sql,
        connection: process.env.DATABASE_CONNECTION_STRING
      });
      
      setQueryResult(result);
    } catch (error) {
      console.error('Query failed:', error);
    }
  };

  return (
    <div>
      <textarea 
        placeholder="Enter SQL query..."
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.ctrlKey) {
            executeQuery(e.target.value);
          }
        }}
      />
      <button onClick={() => executeQuery('SELECT * FROM users LIMIT 10')}>
        Execute Query
      </button>
      
      {queryResult && (
        <pre>{JSON.stringify(queryResult, null, 2)}</pre>
      )}
    </div>
  );
}
```

## Example 4: Custom MCP Server

### Creating Your Own MCP Server

```typescript
// custom-mcp-server.ts
import { MCPServer } from '@anthropic/mcp-sdk';

const server = new MCPServer({
  name: 'custom-tools',
  version: '1.0.0'
});

// Register a custom tool
server.registerTool({
  name: 'weather_check',
  description: 'Get current weather for a location',
  inputSchema: {
    type: 'object',
    properties: {
      location: { type: 'string' }
    },
    required: ['location']
  },
  handler: async ({ location }) => {
    // Your weather API integration
    const weather = await fetchWeatherData(location);
    return {
      temperature: weather.temp,
      condition: weather.condition,
      location
    };
  }
});

// Start server
server.listen(8003);
```

### Using Custom MCP Server

```typescript
export function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const { mcpClient } = useMCP();

  const getWeather = async (location: string) => {
    const result = await mcpClient.callTool('weather_check', {
      location
    });
    setWeather(result);
  };

  return (
    <div className="weather-widget">
      <input 
        type="text"
        placeholder="Enter location..."
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            getWeather(e.target.value);
          }
        }}
      />
      
      {weather && (
        <div>
          <h3>{weather.location}</h3>
          <p>{weather.temperature}°C</p>
          <p>{weather.condition}</p>
        </div>
      )}
    </div>
  );
}
```

## MCP Configuration in Next.js

### API Route for MCP Proxy

```typescript
// app/api/mcp/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { server, tool, args } = await request.json();
  
  // Route to appropriate MCP server
  const mcpServerUrl = getMCPServerUrl(server);
  
  const response = await fetch(`${mcpServerUrl}/tools/${tool}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MCP_SERVER_TOKEN}`
    },
    body: JSON.stringify(args)
  });
  
  const result = await response.json();
  return NextResponse.json(result);
}

function getMCPServerUrl(serverName: string): string {
  const servers = {
    filesystem: process.env.FILESYSTEM_MCP_URL,
    git: process.env.GIT_MCP_URL,
    database: process.env.DATABASE_MCP_URL,
    custom: process.env.CUSTOM_MCP_URL
  };
  
  return servers[serverName] || servers.filesystem;
}
```

### WebSocket Integration

```typescript
// lib/mcp-websocket.ts
export class MCPWebSocketClient {
  private ws: WebSocket;
  
  constructor(serverUrl: string) {
    this.ws = new WebSocket(serverUrl);
    this.setupEventHandlers();
  }
  
  async callTool(toolName: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = generateId();
      
      // Send request
      this.ws.send(JSON.stringify({
        id: requestId,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      }));
      
      // Handle response
      const handler = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        if (response.id === requestId) {
          this.ws.removeEventListener('message', handler);
          
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        }
      };
      
      this.ws.addEventListener('message', handler);
    });
  }
  
  private setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('MCP WebSocket connected');
    };
    
    this.ws.onclose = () => {
      console.log('MCP WebSocket disconnected');
    };
    
    this.ws.onerror = (error) => {
      console.error('MCP WebSocket error:', error);
    };
  }
}
```

## Security Considerations

### Authentication

```typescript
// Secure MCP authentication
const authenticatedMCPCall = async (tool: string, args: any) => {
  const token = await getAuthToken();
  
  const response = await fetch('/api/mcp', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tool, args })
  });
  
  return response.json();
};
```

### Input Validation

```typescript
// Validate MCP inputs
const validateMCPInput = (tool: string, args: any): boolean => {
  const schemas = {
    read_file: {
      type: 'object',
      properties: {
        path: { type: 'string', pattern: '^[a-zA-Z0-9/._-]+$' }
      },
      required: ['path']
    }
  };
  
  const schema = schemas[tool];
  if (!schema) return false;
  
  // Validate against schema
  return validateSchema(args, schema);
};
```

## Best Practices

1. **Error Handling**: Always wrap MCP calls in try-catch blocks
2. **Timeouts**: Set reasonable timeouts for MCP operations
3. **Caching**: Cache MCP results when appropriate
4. **Monitoring**: Log MCP calls for debugging and monitoring
5. **Rate Limiting**: Implement rate limiting for MCP endpoints

## Troubleshooting

### Common Issues

**MCP Server Not Responding:**
- Check server status and logs
- Verify network connectivity
- Ensure correct authentication tokens

**Tool Not Found:**
- Verify tool name spelling
- Check if tool is properly registered
- Review MCP server documentation

**Permission Denied:**
- Check authentication tokens
- Verify user permissions
- Review security configurations

---

This integration opens up powerful possibilities for extending Claude Code UI with external tools and services.
