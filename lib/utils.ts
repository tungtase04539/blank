// Generate random slug with 8 characters, last 3 are "mp4"
export function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  
  // Generate 5 random characters
  let slug = '';
  for (let i = 0; i < 5; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add 3 characters from timestamp for uniqueness
  const timeChars = (Date.now() % 46656).toString(36).padStart(3, '0');
  slug += timeChars;
  
  // Add "mp4" at the end
  slug += 'mp4';
  
  return slug; // Total: 5 + 3 + 3 = 11 chars (e.g., abc12x7ymp4)
}

// Parse multiple video URLs from textarea (one per line)
export function parseVideoUrls(text: string): string[] {
  return text
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);
}

