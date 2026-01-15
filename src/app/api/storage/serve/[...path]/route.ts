import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const path = params.path.join('/');
    
    if (!path) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      );
    }

    // Forward the request to the API worker's storage serve endpoint
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://akademo-api.alexxvives.workers.dev';
    const storageUrl = `${apiUrl}/storage/serve/${path}`;
    
    console.log('[Storage Proxy] Forwarding to:', storageUrl);
    
    const response = await fetch(storageUrl);
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    // Stream the file response
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Length': response.headers.get('Content-Length') || '0',
        'Cache-Control': response.headers.get('Cache-Control') || 'public, max-age=31536000',
      },
    });
  } catch (error: any) {
    console.error('[Storage Proxy] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to serve file' },
      { status: 500 }
    );
  }
}
