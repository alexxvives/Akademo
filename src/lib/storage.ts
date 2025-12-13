import { getCloudflareContext, R2Bucket } from './cloudflare';

export interface StorageAdapter {
  upload(file: File, folder: string): Promise<string>;
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
  getStream(key: string): Promise<ReadableStream | null>;
  getObject(key: string): Promise<{ body: ReadableStream; contentType?: string; size: number } | null>;
}

class R2StorageAdapter implements StorageAdapter {
  private bucket: R2Bucket | null = null;

  private getBucket(): R2Bucket {
    if (!this.bucket) {
      const ctx = getCloudflareContext();
      if (!ctx?.STORAGE) {
        throw new Error('R2 storage not available - are you running on Cloudflare?');
      }
      this.bucket = ctx.STORAGE;
    }
    return this.bucket;
  }

  async upload(file: File, folder: string): Promise<string> {
    const bucket = this.getBucket();
    // Use crypto.randomUUID() which is available in Workers
    const id = crypto.randomUUID().replace(/-/g, '');
    const filename = `${id}-${file.name}`;
    const key = `${folder}/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    
    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return key;
  }

  async getUrl(key: string): Promise<string> {
    // For private content, we serve through our API
    return `/api/storage/serve/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    const bucket = this.getBucket();
    await bucket.delete(key);
  }

  async getStream(key: string): Promise<ReadableStream | null> {
    const bucket = this.getBucket();
    const object = await bucket.get(key);
    return object?.body || null;
  }

  async getObject(key: string): Promise<{ body: ReadableStream; contentType?: string; size: number } | null> {
    const bucket = this.getBucket();
    const object = await bucket.get(key);
    if (!object) return null;
    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType,
      size: object.size
    };
  }
}

// Singleton instance
let r2Adapter: R2StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!r2Adapter) r2Adapter = new R2StorageAdapter();
  return r2Adapter;
}
