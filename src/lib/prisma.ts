// DEPRECATED: This file is no longer used.
// The application now uses raw D1 queries from src/lib/db.ts
// This file is kept for reference only.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPrismaClient(): Promise<any> {
  throw new Error('Prisma is deprecated. Use D1 queries from src/lib/db.ts instead.');
}
