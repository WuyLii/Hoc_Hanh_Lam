import express from 'express';
import {
  handleChat,
  handleGenerateExample,
  handleRoleplay,
  handleCheckJournal,
  handleGenerateMockTest,
  handleOcrExtract,
  handleExtractTextbook,
} from '../src/server/geminiHandlers.js';
import { fetchPublicSpreadsheet } from '../src/server/sheetsHelper.js';

const app = express();
app.use(express.json({ limit: '25mb' }));

// In-memory store for Vercel serverless instance
let memoryStore: Record<string, any> = {};

function serverDeduplicateVocab(items: any[]): any[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, any>();
  items.forEach((item) => {
    if (!item) return;
    const wordKey = String(item.tu || '').trim().toLowerCase();
    const meaningKey = String(item.nghia || '').trim().toLowerCase();
    const langKey = String(item.ngon_ngu || 'ko').trim().toLowerCase();
    if (!wordKey && !item.word_id) return;
    const key = `${langKey}:${wordKey}:${meaningKey}`;
    if (!map.has(key)) {
      map.set(key, { ...item, tu: String(item.tu || '').trim(), nghia: String(item.nghia || '').trim() });
    } else {
      const existing = map.get(key);
      map.set(key, { ...existing, ...item });
    }
  });
  return Array.from(map.values());
}

function serverDeduplicateGrammar(items: any[]): any[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, any>();
  items.forEach((item) => {
    if (!item) return;
    const structKey = String(item.cau_truc || '').trim().toLowerCase();
    const meaningKey = String(item.y_nghia || '').trim().toLowerCase();
    const langKey = String(item.ngon_ngu || 'ko').trim().toLowerCase();
    if (!structKey) return;
    const key = `${langKey}:${structKey}:${meaningKey}`;
    if (!map.has(key)) {
      map.set(key, { ...item, cau_truc: String(item.cau_truc || '').trim() });
    } else {
      const existing = map.get(key);
      map.set(key, { ...existing, ...item });
    }
  });
  return Array.from(map.values());
}

// 1. Cloud Store Sync
app.get('/api/sync/store', (req, res) => {
  res.json({
    success: true,
    store: memoryStore,
    lastUpdated: memoryStore.lastUpdated || null,
  });
});

app.post('/api/sync/store', (req, res) => {
  try {
    const { store } = req.body;
    if (store && typeof store === 'object') {
      Object.keys(store).forEach((key) => {
        if (store[key] !== undefined && store[key] !== null) {
          memoryStore[key] = store[key];
        }
      });
      if (memoryStore.vocabulary) memoryStore.vocabulary = serverDeduplicateVocab(memoryStore.vocabulary);
      if (memoryStore.grammar) memoryStore.grammar = serverDeduplicateGrammar(memoryStore.grammar);
      memoryStore.lastUpdated = new Date().toISOString();
    }
    res.json({
      success: true,
      store: memoryStore,
      lastUpdated: memoryStore.lastUpdated,
    });
  } catch (err: any) {
    console.error('Error in Vercel /api/sync/store:', err);
    res.status(500).json({ error: 'Lỗi khi lưu trữ dữ liệu đám mây' });
  }
});

// 2. Google Sheets Fetch Public
app.post('/api/sheets/fetch-public', async (req, res) => {
  try {
    const { urlOrId } = req.body;
    if (!urlOrId) {
      return res.status(400).json({ error: 'Vui lòng cung cấp URL hoặc ID Google Sheets' });
    }
    const resData = await fetchPublicSpreadsheet(urlOrId);

    if (resData && resData.data) {
      const vocab = resData.data.vocabulary;
      if (Array.isArray(vocab) && vocab.length > 0) {
        memoryStore.vocabulary = serverDeduplicateVocab([...(memoryStore.vocabulary || []), ...vocab]);
      }
      const gram = resData.data.grammar;
      if (Array.isArray(gram) && gram.length > 0) {
        memoryStore.grammar = serverDeduplicateGrammar([...(memoryStore.grammar || []), ...gram]);
      }
      const dks = resData.data.decks;
      if (Array.isArray(dks) && dks.length > 0) memoryStore.decks = dks;

      memoryStore.lastUpdated = new Date().toISOString();
    }

    res.json(resData);
  } catch (error: any) {
    console.error('Error in Vercel /api/sheets/fetch-public:', error);
    res.status(500).json({
      error: error?.message || 'Không thể đọc tệp Google Sheets.',
    });
  }
});

// 3. Gemini Endpoints
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

app.post('/api/gemini/correct-journal', async (req, res) => {
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

app.post('/api/gemini/generate-mock-test', async (req, res) => {
  try {
    const result = await handleGenerateMockTest(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi tạo đề thi' });
  }
});

app.post('/api/gemini/extract-textbook', async (req, res) => {
  try {
    const result = await handleExtractTextbook(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Error in Vercel API /api/gemini/extract-textbook:', error);
    const isTimeout = error?.message?.includes('503') || error?.message?.includes('Deadline expired') || error?.status === 503;
    const errorMessage = isTimeout
      ? 'Quá trình phân tích tài liệu mất quá nhiều thời gian hoặc tệp quá lớn (Lỗi 503: Quá thời gian chờ). Vui lòng thử lại với một phần chương ngắn hơn hoặc dán nội dung văn bản trực tiếp.'
      : (error?.message || 'Lỗi khi xử lý bóc tách sách');
    res.status(500).json({ error: errorMessage });
  }
});

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found on Vercel API' });
});

export default app;

