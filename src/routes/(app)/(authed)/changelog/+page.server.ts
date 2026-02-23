import { readFileSync } from 'fs';
import { resolve } from 'path';
import { marked } from 'marked';

export const load = async ({ parent }) => {
  const changelogPath = resolve('CHANGELOG.md');
  const raw = readFileSync(changelogPath, 'utf-8');
  const parentData = await parent();
  const isProduction =
    parentData.APP_VERSION &&
    !parentData.APP_VERSION.includes('dev') &&
    parentData.APP_VERSION !== 'unknown';

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
