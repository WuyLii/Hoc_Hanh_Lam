import express from 'express';
import {
  handleChat,
  handleGenerateExample,
  handleRoleplay,
  handleCheckJournal,
  handleGenerateMockTest,
  handleOcrExtract,
} from '../src/server/geminiHandlers.js';

const app = express();
app.use(express.json({ limit: '25mb' }));

app.post('/api/gemini/ocr-extract', async (req, res) => {
  try {
    const result = await handleOcrExtract(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in Vercel API /api/gemini/ocr-extract:', error);
    res.status(500).json({ error: error?.message || 'Lỗi khi trích xuất OCR' });
  }
});

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const result = await handleChat(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi chat AI' });
  }
});

app.post('/api/gemini/generate-example', async (req, res) => {
  try {
    const result = await handleGenerateExample(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi tạo ví dụ' });
  }
});

app.post('/api/gemini/roleplay', async (req, res) => {
  try {
    const result = await handleRoleplay(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi roleplay' });
  }
});

app.post('/api/gemini/check-journal', async (req, res) => {
  try {
    const result = await handleCheckJournal(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi chấm bài' });
  }
});

app.post('/api/gemini/mock-test', async (req, res) => {
  try {
    const result = await handleGenerateMockTest(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi tạo đề thi' });
  }
});

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found on Vercel API' });
});

export default app;
