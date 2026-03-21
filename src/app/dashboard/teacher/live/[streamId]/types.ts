export interface StreamInfo {
  id: string;
  title: string;
  className: string;
  classSlug?: string;
  classId: string;
  status: string;
  dailyRoomUrl: string | null;
  academyName?: string;
  academyLogoUrl?: string;
}

export const getLogoSrc = (url: string) => url.startsWith('http') ? url : `/api/storage/serve/${url}`;
