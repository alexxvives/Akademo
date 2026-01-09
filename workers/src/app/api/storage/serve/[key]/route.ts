import { NextRequest } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    
    const storage = getStorageAdapter();
    const object = await storage.getObject(decodedKey);
    
    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    // Determine content type from key extension if not in metadata
    let contentType = object.contentType;
    if (!contentType) {
      const ext = decodedKey.split('.').pop()?.toLowerCase() || '';
      const contentTypes: { [key: string]: string } = {
        'mp4': 'video/mp4',
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
      };
      contentType = contentTypes[ext] || 'application/octet-stream';
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': object.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('File not found', { status: 404 });
  }
}
