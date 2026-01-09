import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { videoId, userId } = await req.json();

    if (!videoId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Video ID and User ID are required' },
        { status: 400 }
      );
    }

    // Reset the play state for this user and video (dev tool - no auth check)
    const db = await getDB();
    await db
      .prepare(
        `UPDATE VideoPlayState 
         SET totalWatchTimeSeconds = 0, 
             sessionStartTime = datetime('now'),
             lastUpdateTime = datetime('now')
         WHERE userId = ? AND videoId = ?`
      )
      .bind(userId, videoId)
      .run();

    return NextResponse.json({
      success: true,
      message: 'Watch time reset successfully',
    });
  } catch (error) {
    console.error('Error resetting watch time:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
