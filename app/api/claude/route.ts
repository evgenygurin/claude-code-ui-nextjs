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

    const { message, sessionId, context } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get Claude API key from environment
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return NextResponse.json({ error: 'Claude API key not configured' }, { status: 500 });
    }

    // Prepare the context for Claude
    const systemPrompt = `You are Claude Code UI assistant, helping users with software development tasks.
${context ? `\nContext: ${JSON.stringify(context)}` : ''}

Current session: ${sessionId || 'new'}
User: ${session.user?.name || 'Anonymous'}`;

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      console.error('Claude API error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from Claude' },
        { status: claudeResponse.status }
      );
    }

    const claudeData = await claudeResponse.json();
    const responseContent = claudeData.content?.[0]?.text || 'No response from Claude';

    // Return the response
    return NextResponse.json({
      response: responseContent,
      sessionId: sessionId || `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      model: 'claude-3-sonnet-20240229'
    });

  } catch (error) {
    console.error('Claude API route error:', error);
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

    // Return session info or available models
    return NextResponse.json({
      available: true,
      models: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      sessionId: sessionId || null,
      status: 'ready'
    });

  } catch (error) {
    console.error('Claude API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}