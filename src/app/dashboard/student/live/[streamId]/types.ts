export interface StreamInfo {
  id: string;
  title: string;
  className: string;
  classId: string;
  classSlug?: string;
  status: string;
  academyName?: string;
  academyLogoUrl?: string;
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  id: string;
}

export const getLogoSrc = (url: string) =>
  url.startsWith('http') ? url : `/api/storage/serve/${url}`;
