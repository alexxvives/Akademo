import { requireAuth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { pushChatMessage, getRecentMessages, deleteStreamMessages } from '@/lib/firebase';

// GET: Fetch recent messages for a stream
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const url = new URL(request.url);
    const streamId = url.searchParams.get('streamId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    if (!streamId) {
      return errorResponse('streamId is required', 400);
    }

    const messages = await getRecentMessages(streamId, limit);
    
    return Response.json(successResponse({ messages }));
  } catch (error: any) {
    console.error('Chat GET error:', error);
    return errorResponse(error.message || 'Failed to get messages', 500);
  }
}

// POST: Send a new chat message
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { streamId, message, type = 'message' } = await request.json();
    
    if (!streamId || !message) {
      return errorResponse('streamId and message are required', 400);
    }

    // Validate message length
    if (message.length > 500) {
      return errorResponse('Message too long (max 500 characters)', 400);
    }

    const messageId = await pushChatMessage(streamId, {
      userId: session.id,
      userName: `${session.firstName} ${session.lastName}` || session.email.split('@')[0],
      userRole: session.role as 'TEACHER' | 'STUDENT',
      message,
      type,
    });

    return Response.json(successResponse({ 
      messageId,
      success: true,
    }));
  } catch (error: any) {
    console.error('Chat POST error:', error);
    return errorResponse(error.message || 'Failed to send message', 500);
  }
}

// DELETE: Clear chat messages (teacher/admin only)
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    
    if (session.role === 'STUDENT') {
      return errorResponse('Not authorized', 403);
    }
    
    const { streamId } = await request.json();
    
    if (!streamId) {
      return errorResponse('streamId is required', 400);
    }

    await deleteStreamMessages(streamId);
    
    return Response.json(successResponse({ 
      success: true,
      message: 'Chat cleared',
    }));
  } catch (error: any) {
    console.error('Chat DELETE error:', error);
    return errorResponse(error.message || 'Failed to clear chat', 500);
  }
}
