import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { liveStreamQueries, classQueries, membershipQueries } from '@/lib/db';
import { createRoom, createMeetingToken } from '@/lib/daily';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// GET /api/stream - Get active stream for a class
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return errorResponse('classId is required');
    }

    const stream = await liveStreamQueries.findActiveByClass(classId);
    
    if (!stream) {
      return NextResponse.json({ success: true, data: null });
    }

    // Generate a token for the user to join
    const userName = `${session.firstName} ${session.lastName}`;
    const isOwner = session.role === 'TEACHER' && stream.teacherId === session.id;
    
    const token = await createMeetingToken({
      roomName: stream.roomName,
      userName,
      isOwner,
      userId: session.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...stream,
        token,
        isOwner,
      },
    });
  } catch (error) {
    console.error('Get stream error:', error);
    return errorResponse('Failed to get stream', 500);
  }
}

// POST /api/stream - Create a new stream
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'TEACHER') {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { classId, title } = body;

    if (!classId) {
      return errorResponse('classId is required');
    }

    // Check if teacher has access to this class
    const classData = await classQueries.findWithAcademyAndCounts(classId) as any;
    if (!classData) {
      return errorResponse('Class not found', 404);
    }

    // Verify teacher belongs to the academy (check membership or ownership)
    const isOwner = classData.academy?.ownerId === session.id;
    const membership = await membershipQueries.findByUserAndAcademy(session.id, classData.academyId) as any;
    const hasAccess = isOwner || (membership && membership.status === 'APPROVED');
    
    if (!hasAccess) {
      return errorResponse('You do not have access to this class', 403);
    }

    // Check if there's already an active stream
    const existing = await liveStreamQueries.findActiveByClass(classId);
    if (existing) {
      return errorResponse('A stream is already active for this class');
    }

    // Generate unique room name
    const roomName = `akademo-${classId}-${Date.now()}`;

    // Create Daily.co room
    const dailyRoom = await createRoom({
      name: roomName,
      enableRecording: true,
      expiryMinutes: 480, // 8 hours max
    });

    // Create stream record
    const stream = await liveStreamQueries.create({
      classId,
      teacherId: session.id,
      roomName: dailyRoom.name,
      roomUrl: dailyRoom.url,
      title,
    });

    // Generate owner token for teacher
    const token = await createMeetingToken({
      roomName: dailyRoom.name,
      userName: `${session.firstName} ${session.lastName}`,
      isOwner: true,
      userId: session.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...stream,
        token,
        isOwner: true,
      },
    });
  } catch (error) {
    console.error('Create stream error:', error);
    return errorResponse('Failed to create stream', 500);
  }
}
