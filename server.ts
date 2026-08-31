import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  handleOcrExtract,
  handleExtractTextbook,
  handleChat,
  handleGenerateExample,
  handleRoleplay,
  handleCheckJournal,
  handleGenerateMockTest,
  formatGeminiError,
} from './src/server/geminiHandlers.ts';
import { fetchPublicSpreadsheet } from './src/server/sheetsHelper.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent Server Cloud Store for Cross-Device & Cross-Browser Sync
const STORE_FILE = path.join(__dirname, 'cloud_store.json');

interface CloudStore {
  vocabulary?: any[];
  grammar?: any[];
  decks?: any[];
  reviewSessions?: any[];
  mockTests?: any[];
  listeningExercises?: any[];
  progressLogs?: any[];
  journalEntries?: any[];
  notifications?: any[];
  chatHistory?: any[];
  currentUser?: any;
  currentLanguage?: string;
  sheetsConfig?: any;
  lastUpdated?: string;
}

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

let memoryStore: CloudStore = {};

try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    memoryStore = JSON.parse(raw);
    if (memoryStore.vocabulary) memoryStore.vocabulary = serverDeduplicateVocab(memoryStore.vocabulary);
    if (memoryStore.grammar) memoryStore.grammar = serverDeduplicateGrammar(memoryStore.grammar);
    console.log('📦 Loaded existing cloud_store.json with', Object.keys(memoryStore).length, 'keys');
  }
} catch (e) {
  console.error('Failed to read cloud_store.json:', e);
}

function saveMemoryStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save cloud_store.json:', e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // 1. General Language AI Chat & Multi-modal Image Analysis
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const result = await handleChat(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/gemini/chat:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi kết nối với máy chủ Gia sư AI' });
    }
  });

  // 2. Vocabulary Enrichment & Auto Example Generator
  app.post('/api/gemini/generate-example', async (req, res) => {
    try {
      const result = await handleGenerateExample(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/gemini/generate-example:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi tạo dữ liệu từ vựng' });
    }
  });

  // 3. Situational Roleplay Conversation
  app.post('/api/gemini/roleplay', async (req, res) => {
    try {
      const result = await handleRoleplay(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/gemini/roleplay:', error);
      res.status(500).json({ error: error?.message || 'Lỗi hội thoại tình huống' });
    }
  });

  // 4. Learning Journal Grammar & Phrasing Review
  const handleJournalReview = async (req: express.Request, res: express.Response) => {
    try {
      const result = await handleCheckJournal(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in journal check endpoint:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi kiểm tra nhật ký' });
    }
  };

  app.post('/api/gemini/check-journal', handleJournalReview);
  app.post('/api/gemini/correct-journal', handleJournalReview);

  // 5. Dynamic Standardized Mock Test Generator (TOEIC/IELTS, TOPIK, HSK)
  app.post('/api/gemini/generate-mock-test', async (req, res) => {
    try {
      const result = await handleGenerateMockTest(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/gemini/generate-mock-test:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi tạo đề thi thử' });
    }
  });

  // 6. OCR Photo Extractor to Vocabulary Deck (Supports Multiple Images)
  app.post('/api/gemini/ocr-extract', async (req, res) => {
    try {
      const data = await handleOcrExtract(req.body);
      res.json(data);
    } catch (error: any) {
      console.error('Error in /api/gemini/ocr-extract:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi trích xuất từ ảnh' });
    }
  });

  // 7. Large Textbook & Language Book Full AI Extractor
  app.post('/api/gemini/extract-textbook', async (req, res) => {
    try {
      const result = await handleExtractTextbook(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/gemini/extract-textbook:', error);
      const isTimeout = error?.message?.includes('503') || error?.message?.includes('Deadline expired') || error?.status === 503;
      const errorMessage = isTimeout
        ? 'Quá trình phân tích tài liệu mất quá nhiều thời gian hoặc tệp quá lớn (Lỗi 503: Quá thời gian chờ). Vui lòng thử lại với một phần chương ngắn hơn hoặc dán nội dung văn bản trực tiếp.'
        : (error?.message || 'Lỗi khi xử lý bóc tách sách');
      res.status(500).json({ error: errorMessage });
    }
  });

  // 8. Google Sheets Public / Shared URL Direct Fetch & Auto Sync
  app.post('/api/sheets/fetch-public', async (req, res) => {
    try {
      const { urlOrId } = req.body;
      if (!urlOrId) {
        return res.status(400).json({ error: 'Vui lòng cung cấp URL hoặc ID Google Sheets' });
      }
      const resData = await fetchPublicSpreadsheet(urlOrId);

      // Merge Google Sheets data directly into cloud memoryStore so all devices get it immediately
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
        saveMemoryStore();
      }

      res.json(resData);
    } catch (error: any) {
      console.error('Error in /api/sheets/fetch-public:', error);
      res.status(500).json({
        error: error?.message || 'Không thể đọc tệp Google Sheets. Vui lòng đảm bảo tệp ở chế độ "Bất kỳ ai có đường liên kết đều có thể xem".',
      });
    }
  });

  // 9. Unified Cross-Device Cloud Store API (Safari, PWA, Chrome, Mobile Sync)
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
        // Smart merge with strict deduplication
        Object.keys(store).forEach((key) => {
          if (store[key] !== undefined && store[key] !== null) {
            (memoryStore as any)[key] = store[key];
          }
        });
        if (memoryStore.vocabulary) memoryStore.vocabulary = serverDeduplicateVocab(memoryStore.vocabulary);
        if (memoryStore.grammar) memoryStore.grammar = serverDeduplicateGrammar(memoryStore.grammar);
        memoryStore.lastUpdated = new Date().toISOString();
        saveMemoryStore();
      }
      res.json({
        success: true,
        store: memoryStore,
        lastUpdated: memoryStore.lastUpdated,
      });
    } catch (err: any) {
      console.error('Error in /api/sync/store:', err);
      res.status(500).json({ error: 'Lỗi khi lưu trữ dữ liệu đám mây' });
    }
  });

  // Fallback for any other unmatched /api/* routes to prevent returning HTML
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Vite middleware setup for development / static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
