import { readFileSync } from 'fs';
import { resolve } from 'path';
import { marked } from 'marked';
import { env } from '$env/dynamic/private';

export const load = async () => {
  const changelogPath = resolve('CHANGELOG.md');
  const raw = readFileSync(changelogPath, 'utf-8');
  const isProduction = env.NODE_ENV === 'production';

  // Split the changelog into stable and dev entries
  const lines = raw.split('\n');
  let stableMarkdown = '';
  let isDev = false;

  for (const line of lines) {
    // Detect version headers (# or ##)
    if (/^#{1,2}\s+\[?\d/.test(line) || /^#{1,2}\s+\d/.test(line)) {
      isDev = /-dev/.test(line);
    }

    if (!isDev) {
      stableMarkdown += line + '\n';
    }
  }

  const stableHtml = await marked(stableMarkdown);

  return {
    fullHtml: isProduction ? null : await marked(raw),
    stableHtml,
    isProduction
  };
};
