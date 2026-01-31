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
    
    // Extract filename from content-disposition header if present
    const contentDisposition = response.headers.get('content-disposition') || '';
    const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
    const filename = filenameMatch ? filenameMatch[1] : 'document.pdf';

    // Return the file with inline disposition (opens in browser instead of downloading)
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
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
