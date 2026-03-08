import { NextRequest, NextResponse } from 'next/server';

// Proxy document viewing through the main domain (opens in browser instead of downloading)
// This hides the Cloudflare worker URL from users
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Re-encode each path component to handle special characters (spaces, parentheses, etc.)
    const encodedPath = params.path.map(encodeURIComponent).join('/');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://akademo-api.alexxvives.workers.dev';
    const documentUrl = `${apiUrl}/storage/serve/${encodedPath}`;

    // Cloudflare Workers strip the Cookie header from cross-origin sub-requests.
    // The API worker supports Authorization: Bearer <token> as a fallback,
    // so extract the session cookie and forward it that way instead.
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionToken = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('academy_session='))
      ?.slice('academy_session='.length) || '';

    const forwardHeaders: HeadersInit = {};
    if (sessionToken) {
      forwardHeaders['Authorization'] = `Bearer ${sessionToken}`;
    }

    // Forward the request to the API worker
    const response = await fetch(documentUrl, { headers: forwardHeaders });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/pdf';

    // Stream the response body instead of buffering to avoid memory issues with large files
    return new NextResponse(response.body, {
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
