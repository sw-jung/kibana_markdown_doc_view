import sanitizeHtml from 'sanitize-html';

sanitizeMarkdown.defaults = sanitizeHtml.defaults;
export function sanitizeMarkdown(markdown, options) {
  return sanitizeHtml(markdown, options)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}