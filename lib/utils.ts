// Generate random slug with 8 characters, last 3 are "mp4"
export function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  
  // Generate first 5 random characters
  for (let i = 0; i < 5; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add "mp4" at the end
  slug += 'mp4';
  
  return slug;
}

// Parse multiple video URLs from textarea (one per line)
export function parseVideoUrls(text: string): string[] {
  return text
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);
}

