import { NextRequest, NextResponse } from 'next/server';

// This endpoint handles channel-related requests for real-time communication
// It appears to be called by the frontend for establishing connections or polling

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('id');
    const action = searchParams.get('action');

    // Log the request for debugging
    console.log('Channel GET request:', { channelId, action, url: request.url });

    // Handle different channel actions
    switch (action) {
      case 'connect':
        return NextResponse.json({
          status: 'connected',
          channelId,
          timestamp: new Date().toISOString(),
        });

      case 'poll':
        return NextResponse.json({
          status: 'ok',
          messages: [],
          timestamp: new Date().toISOString(),
        });

      case 'status':
        return NextResponse.json({
          status: 'active',
          channelId,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          status: 'ok',
          message: 'Channel endpoint is active',
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('Channel GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Channel POST request:', body);

    // Handle different channel operations
    const { action, channelId, data } = body;

    switch (action) {
      case 'send':
        return NextResponse.json({
          status: 'sent',
          channelId,
          messageId: `msg_${Date.now()}`,
          timestamp: new Date().toISOString(),
        });

      case 'subscribe':
        return NextResponse.json({
          status: 'subscribed',
          channelId,
          subscriptionId: `sub_${Date.now()}`,
          timestamp: new Date().toISOString(),
        });

      case 'unsubscribe':
        return NextResponse.json({
          status: 'unsubscribed',
          channelId,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          status: 'received',
          data,
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('Channel POST error:', error);
    return NextResponse.json(
      { 
        error: 'Bad request',
        message: error instanceof Error ? error.message : 'Invalid request body',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
