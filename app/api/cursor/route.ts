import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { command, cwd, sessionId } = await request.json();

    if (!command?.trim()) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    // Get Cursor API key from environment
    const cursorApiKey = process.env.CURSOR_API_KEY;
    if (!cursorApiKey) {
      return NextResponse.json({ error: 'Cursor API key not configured' }, { status: 500 });
    }

    // Prepare command execution context
    const executionContext = {
      command: command.trim(),
      workingDirectory: cwd || process.cwd(),
      sessionId: sessionId || `cursor_${Date.now()}`,
      user: session.user?.name || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    // For now, we'll simulate Cursor CLI integration
    // In a real implementation, this would interact with the actual Cursor CLI
    let result;
    
    if (command.startsWith('cursor ')) {
      // Simulate Cursor CLI commands
      const cursorCommand = command.slice(7).trim();
      
      switch (true) {
        case cursorCommand === 'version':
          result = {
            output: 'Cursor CLI v1.2.0\nIntegrated with Claude Code UI',
            exitCode: 0,
            type: 'success'
          };
          break;
          
        case cursorCommand.startsWith('open'):
          const file = cursorCommand.slice(5).trim();
          result = {
            output: `Opening ${file || 'current directory'} in Cursor...`,
            exitCode: 0,
            type: 'success'
          };
          break;
          
        case cursorCommand === 'status':
          result = {
            output: 'Cursor IDE Status: Running\nProjects: 3 open\nExtensions: 12 loaded',
            exitCode: 0,
            type: 'success'
          };
          break;
          
        default:
          result = {
            output: `Executing Cursor command: ${cursorCommand}`,
            exitCode: 0,
            type: 'info'
          };
      }
    } else {
      // Handle general terminal commands
      result = {
        output: `Command '${command}' would be executed in Cursor terminal`,
        exitCode: 0,
        type: 'info'
      };
    }

    return NextResponse.json({
      ...result,
      sessionId: executionContext.sessionId,
      timestamp: executionContext.timestamp,
      context: executionContext
    });

  } catch (error) {
    console.error('Cursor API route error:', error);
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

    // Return Cursor CLI status and available commands
    return NextResponse.json({
      available: true,
      version: '1.2.0',
      commands: [
        'cursor version',
        'cursor open [file]',
        'cursor status',
        'cursor --help'
      ],
      sessionId: sessionId || null,
      status: 'ready',
      integration: 'simulated' // In real implementation, this would check actual Cursor CLI
    });

  } catch (error) {
    console.error('Cursor API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}