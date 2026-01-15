import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy to the worker API for backwards compatibility
 * The actual logic is now in workers/akademo-api/src/routes/auth.ts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const { teacherId } = await params;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://akademo-api.alexxvives.workers.dev';
    
    const response = await fetch(`${apiUrl}/auth/join/${teacherId}`);
    const result = await response.json();
    
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('[Join API Proxy] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al cargar los datos del profesor'
    }, { status: 500 });
  }
}
