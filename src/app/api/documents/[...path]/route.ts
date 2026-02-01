import { NextRequest, NextResponse } from 'next/server';

// Proxy document viewing through the main domain (opens in browser instead of downloading)
// This hides the Cloudflare worker URL from users
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://akademo-api.alexxvives.workers.dev';
    const documentUrl = `${apiUrl}/storage/serve/${path}`;

    // Forward the request to the API worker
    const response = await fetch(documentUrl, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: response.status }
      );
    }

    // Get the file content
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/pdf';
    
    // Return the file without Content-Disposition header to allow browser to handle viewing
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Document proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
