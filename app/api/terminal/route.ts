import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Store for terminal sessions (in production, use Redis or database)
const terminalSessions = new Map<string, {
  id: string;
  cwd: string;
  history: Array<{
    command: string;
    output: string;
    timestamp: string;
    exitCode: number;
  }>;
  created: string;
  lastActivity: string;
}>();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { command, sessionId, action } = await request.json();

    if (action === 'create') {
      // Create new terminal session
      const newSessionId = `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newSession = {
        id: newSessionId,
        cwd: process.cwd(),
        history: [],
        created: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      
      terminalSessions.set(newSessionId, newSession);
      
      return NextResponse.json({
        sessionId: newSessionId,
        cwd: newSession.cwd,
        message: 'Terminal session created',
        welcome: 'Welcome to Claude Code Terminal\nType "help" for available commands.'
      });
    }

    if (!command?.trim() || !sessionId) {
      return NextResponse.json({ error: 'Command and sessionId are required' }, { status: 400 });
    }

    // Get or create session
    let terminalSession = terminalSessions.get(sessionId);
    if (!terminalSession) {
      terminalSession = {
        id: sessionId,
        cwd: process.cwd(),
        history: [],
        created: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      terminalSessions.set(sessionId, terminalSession);
    }

    // Process command
    const cmd = command.trim();
    let output: string;
    let exitCode = 0;
    
    // Simulate terminal commands
    switch (true) {
      case cmd === 'help':
        output = `Available commands:
  help        - Show this help message
  pwd         - Print working directory
  ls          - List directory contents
  cd <dir>    - Change directory
  echo <text> - Print text
  clear       - Clear terminal
  date        - Show current date
  whoami      - Show current user
  exit        - Close terminal session`;
        break;
        
      case cmd === 'pwd':
        output = terminalSession.cwd;
        break;
        
      case cmd === 'ls':
        output = 'package.json  src/  components/  app/  docs/  README.md  node_modules/';
        break;
        
      case cmd.startsWith('cd '):
        const newDir = cmd.slice(3).trim();
        if (newDir === '..') {
          output = 'Changed to parent directory';
        } else if (newDir === '~' || newDir === '/') {
          output = 'Changed to home directory';
        } else {
          output = `Changed to ${newDir}`;
        }
        break;
        
      case cmd.startsWith('echo '):
        output = cmd.slice(5);
        break;
        
      case cmd === 'clear':
        // Clear history for this session
        terminalSession.history = [];
        output = 'Terminal cleared';
        break;
        
      case cmd === 'date':
        output = new Date().toString();
        break;
        
      case cmd === 'whoami':
        output = session.user?.name || 'user';
        break;
        
      case cmd === 'exit':
        terminalSessions.delete(sessionId);
        output = 'Terminal session closed';
        break;
        
      case cmd.startsWith('npm '):
        output = `Executing: ${cmd}\n[npm output would appear here]`;
        break;
        
      case cmd.startsWith('git '):
        output = `Executing: ${cmd}\n[git output would appear here]`;
        break;
        
      default:
        output = `Command not found: ${cmd}\nType "help" for available commands.`;
        exitCode = 1;
    }

    // Add to history
    const historyEntry = {
      command: cmd,
      output,
      timestamp: new Date().toISOString(),
      exitCode
    };
    
    terminalSession.history.push(historyEntry);
    terminalSession.lastActivity = new Date().toISOString();

    // Keep history limited to last 100 commands
    if (terminalSession.history.length > 100) {
      terminalSession.history = terminalSession.history.slice(-100);
    }

    return NextResponse.json({
      output,
      exitCode,
      sessionId,
      timestamp: historyEntry.timestamp,
      cwd: terminalSession.cwd,
      historyLength: terminalSession.history.length
    });

  } catch (error) {
    console.error('Terminal API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session
      const terminalSession = terminalSessions.get(sessionId);
      if (!terminalSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      return NextResponse.json({
        session: terminalSession,
        isActive: true
      });
    }

    // List all sessions
    const sessions = Array.from(terminalSessions.values()).map(session => ({
      id: session.id,
      cwd: session.cwd,
      created: session.created,
      lastActivity: session.lastActivity,
      commandCount: session.history.length
    }));

    return NextResponse.json({
      sessions,
      count: sessions.length
    });

  } catch (error) {
    console.error('Terminal API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const deleted = terminalSessions.delete(sessionId);
    if (!deleted) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Terminal session deleted',
      sessionId
    });

  } catch (error) {
    console.error('Terminal API DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}