import { error } from '@sveltejs/kit';
import { createReadStream } from 'fs';

export const GET = async ({ params }) => {
  const { filename } = params;

  // creating a readable stream from the log file
  const file = createReadStream(`db/logs/${filename}`);

  if (!file) {
    error(404, 'Log file not found');
  }

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of file) {
        controller.enqueue(chunk);
      }
    }
  });

  const contentType = filename.split('.').pop() === 'zip' ? 'application/zip' : 'text/plain';

  return new Response(stream, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': contentType
    }
  });
};
