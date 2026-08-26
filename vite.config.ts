import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import {
  handleChat,
  handleGenerateExample,
  handleRoleplay,
  handleCheckJournal,
  handleGenerateMockTest,
  handleOcrExtract,
} from './src/server/geminiHandlers.ts';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/gemini/')) {
          return next();
        }

        const url = req.url.split('?')[0];

        // Parse JSON body
        let body = {};
        if (req.method === 'POST') {
          try {
            const buffers: Buffer[] = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const dataStr = Buffer.concat(buffers).toString();
            if (dataStr) {
              body = JSON.parse(dataStr);
            }
          } catch (e) {
            console.error('Failed to parse request JSON', e);
          }
        }

        res.setHeader('Content-Type', 'application/json');

        try {
          if (url === '/api/gemini/chat') {
            const data = await handleChat(body);
            res.end(JSON.stringify(data));
          } else if (url === '/api/gemini/generate-example') {
            const data = await handleGenerateExample(body);
            res.end(JSON.stringify(data));
          } else if (url === '/api/gemini/roleplay') {
            const data = await handleRoleplay(body);
            res.end(JSON.stringify(data));
          } else if (url === '/api/gemini/check-journal') {
            const data = await handleCheckJournal(body);
            res.end(JSON.stringify(data));
          } else if (url === '/api/gemini/generate-mock-test') {
            const data = await handleGenerateMockTest(body);
            res.end(JSON.stringify(data));
          } else if (url === '/api/gemini/ocr-extract') {
            const data = await handleOcrExtract(body);
            res.end(JSON.stringify(data));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Endpoint not found' }));
          }
        } catch (error: any) {
          console.error(`API Error on ${url}:`, error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error?.message || 'Server error' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
