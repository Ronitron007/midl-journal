/**
 * Strip HTML tags to get plain text for summaries/previews
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Check if HTML content is empty (just whitespace or empty tags)
 */
export function isHtmlEmpty(html: string): boolean {
  if (!html) return true;
  const plainText = htmlToPlainText(html);
  return plainText.length === 0;
}

/**
 * Truncate HTML content safely (converts to plain text first)
 */
export function truncateHtml(html: string, maxLength: number): string {
  const plainText = htmlToPlainText(html);
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength - 3) + '...';
}

/**
 * Count words in HTML content
 */
export function wordCount(html: string): number {
  const plainText = htmlToPlainText(html);
  return plainText.split(/\s+/).filter(Boolean).length;
}
