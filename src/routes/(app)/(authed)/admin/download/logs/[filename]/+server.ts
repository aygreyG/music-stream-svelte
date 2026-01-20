import { error } from '@sveltejs/kit';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

export const GET = async ({ params }) => {
  const { filename } = params;

  // creating a readable stream from the log file
  if (!existsSync(`db/logs/${filename}`)) {
    error(404, 'Log file not found');
  }

  const file = await readFile(`db/logs/${filename}`);

  const contentType = filename.split('.').pop() === 'zip' ? 'application/zip' : 'text/plain';

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': contentType
    }
  });
};
