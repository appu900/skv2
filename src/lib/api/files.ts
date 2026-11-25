// Uploaded files live in a private S3 bucket. The browser opens them through the backend, which checks
// the session and redirects to a short-lived signed link; this works for <a href> and <img src> alike.
const S3_URL = /^https:\/\/([^/]+\.)?s3[.-][^/]*amazonaws\.com\//;

export function fileUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return S3_URL.test(url) ? `/api/backend/files/view?url=${encodeURIComponent(url)}` : url;
}
