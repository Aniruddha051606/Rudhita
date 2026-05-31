import { API } from '@/api/client';

// Uploads a File to Cloudflare R2 via a backend-issued presigned URL.
// Returns the public URL to store as the product's image_url.
export async function uploadImage(file) {
  if (!file) throw new Error('No file selected.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB.');

  // 1) Ask backend for a presigned PUT URL
  const { upload_url, public_url } = await API.upload.getUrl(file.name, file.type);

  // 2) PUT the bytes straight to R2 (does not pass through our backend)
  const res = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Upload to storage failed. Please try again.');

  // 3) Return the public URL for saving on the product
  return public_url;
}
