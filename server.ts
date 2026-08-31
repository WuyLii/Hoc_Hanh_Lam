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

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

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
  app.get('/api/sync/status', (req, res) => {
    res.json({
      success: true,
      lastUpdated: memoryStore.lastUpdated || '',
      vocabCount: (memoryStore.vocabulary || []).length,
      grammarCount: (memoryStore.grammar || []).length,
      decksCount: (memoryStore.decks || []).length,
    });
  });

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

  // 10. Direct Server REST APIs for Vocabulary (CRUD & Search directly on server disk)
  app.get('/api/vocabulary', (req, res) => {
    try {
      const { lang, search, topic, level, limit, page } = req.query;
      let list = memoryStore.vocabulary || [];

      if (lang) {
        list = list.filter((item) => item.ngon_ngu === lang);
      }
      if (topic && topic !== 'ALL') {
        list = list.filter((item) => item.chu_de === topic);
      }
      if (level && level !== 'ALL') {
        list = list.filter((item) => item.cap_do === level || (item.cap_do && item.cap_do.includes(String(level))));
      }
      if (search) {
        const q = String(search).toLowerCase().trim();
        list = list.filter((item) =>
          (item.tu && item.tu.toLowerCase().includes(q)) ||
          (item.nghia && item.nghia.toLowerCase().includes(q)) ||
          (item.phien_am && item.phien_am.toLowerCase().includes(q)) ||
          (item.nghia_tieng_han && item.nghia_tieng_han.toLowerCase().includes(q)) ||
          (item.nghia_tieng_anh && item.nghia_tieng_anh.toLowerCase().includes(q))
        );
      }

      const total = list.length;
      if (limit && page) {
        const lim = parseInt(String(limit), 10) || 50;
        const pg = parseInt(String(page), 10) || 1;
        const start = (pg - 1) * lim;
        list = list.slice(start, start + lim);
      }

      res.json({
        success: true,
        total,
        vocabulary: list,
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Lỗi đọc từ vựng từ máy chủ' });
    }
  });

  app.post('/api/vocabulary', (req, res) => {
    try {
      const item = req.body;
      if (!item || !item.tu) {
        return res.status(400).json({ error: 'Thiếu thông tin từ vựng' });
      }
      if (!item.word_id) {
        item.word_id = `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
      if (!item.created_at) {
        item.created_at = new Date().toISOString().split('T')[0];
      }
      if (!memoryStore.vocabulary) memoryStore.vocabulary = [];

      // Check if already exists
      const existingIdx = memoryStore.vocabulary.findIndex((w) => w.word_id === item.word_id);
      if (existingIdx >= 0) {
        memoryStore.vocabulary[existingIdx] = { ...memoryStore.vocabulary[existingIdx], ...item };
      } else {
        memoryStore.vocabulary.unshift(item);
      }

      memoryStore.vocabulary = serverDeduplicateVocab(memoryStore.vocabulary);
      memoryStore.lastUpdated = new Date().toISOString();
      saveMemoryStore();

      res.json({ success: true, item, total: memoryStore.vocabulary.length });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Lỗi lưu từ vựng lên máy chủ' });
    }
  });

  app.put('/api/vocabulary/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (!memoryStore.vocabulary) memoryStore.vocabulary = [];

      const idx = memoryStore.vocabulary.findIndex((w) => w.word_id === id);
      if (idx >= 0) {
        memoryStore.vocabulary[idx] = { ...memoryStore.vocabulary[idx], ...updates };
        memoryStore.lastUpdated = new Date().toISOString();
        saveMemoryStore();
        res.json({ success: true, item: memoryStore.vocabulary[idx] });
      } else {
        res.status(404).json({ error: 'Không tìm thấy từ vựng' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Lỗi cập nhật từ vựng' });
    }
  });

  app.delete('/api/vocabulary/:id', (req, res) => {
    try {
      const { id } = req.params;
      if (!memoryStore.vocabulary) memoryStore.vocabulary = [];
      const before = memoryStore.vocabulary.length;
      memoryStore.vocabulary = memoryStore.vocabulary.filter((w) => w.word_id !== id);
      const deleted = before > memoryStore.vocabulary.length;
      if (deleted) {
        memoryStore.lastUpdated = new Date().toISOString();
        saveMemoryStore();
      }
      res.json({ success: true, deleted, total: memoryStore.vocabulary.length });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Lỗi xóa từ vựng trên máy chủ' });
    }
  });

  app.post('/api/vocabulary/batch-delete', (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) return res.status(400).json({ error: 'Danh sách ID không hợp lệ' });
      const idSet = new Set(ids);
      if (!memoryStore.vocabulary) memoryStore.vocabulary = [];
      memoryStore.vocabulary = memoryStore.vocabulary.filter((w) => !idSet.has(w.word_id));
      memoryStore.lastUpdated = new Date().toISOString();
      saveMemoryStore();
      res.json({ success: true, total: memoryStore.vocabulary.length });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Lỗi xóa hàng loạt từ vựng' });
    }
  });

  // 11. Direct Server REST APIs for Grammar
  app.get('/api/grammar', (req, res) => {
    try {
      const { lang } = req.query;
      let list = memoryStore.grammar || [];
      if (lang) {
        list = list.filter((g) => g.ngon_ngu === lang);
      }
      res.json({ success: true, grammar: list, total: list.length });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Lỗi đọc ngữ pháp từ máy chủ' });
    }
  });

  app.post('/api/grammar', (req, res) => {
    try {
      const item = req.body;
      if (!item || !item.cau_truc) return res.status(400).json({ error: 'Thiếu cấu trúc ngữ pháp' });
      if (!item.grammar_id) {
        item.grammar_id = `g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
      if (!memoryStore.grammar) memoryStore.grammar = [];
      memoryStore.grammar.unshift(item);
      memoryStore.grammar = serverDeduplicateGrammar(memoryStore.grammar);
      memoryStore.lastUpdated = new Date().toISOString();
      saveMemoryStore();
      res.json({ success: true, item });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Lỗi lưu ngữ pháp' });
    }
  });

  app.put('/api/grammar/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (!memoryStore.grammar) memoryStore.grammar = [];
      const idx = memoryStore.grammar.findIndex((g) => g.grammar_id === id);
      if (idx >= 0) {
        memoryStore.grammar[idx] = { ...memoryStore.grammar[idx], ...updates };
        memoryStore.lastUpdated = new Date().toISOString();
        saveMemoryStore();
        res.json({ success: true, item: memoryStore.grammar[idx] });
      } else {
        res.status(404).json({ error: 'Không tìm thấy mục ngữ pháp' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Lỗi cập nhật ngữ pháp' });
    }
  });

  app.delete('/api/grammar/:id', (req, res) => {
    try {
      const { id } = req.params;
      if (!memoryStore.grammar) memoryStore.grammar = [];
      memoryStore.grammar = memoryStore.grammar.filter((g) => g.grammar_id !== id);
      memoryStore.lastUpdated = new Date().toISOString();
      saveMemoryStore();
      res.json({ success: true, total: memoryStore.grammar.length });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Lỗi xóa ngữ pháp' });
    }
  });

  // 12. External SQL & Supabase Integration (Schema DDL & Export)
  app.get('/api/database/sql-schema', (req, res) => {
    const schemaSql = `-- ==========================================
-- BẢNG TỪ VỰNG & NGỮ PHÁP (SUPABASE / POSTGRESQL)
-- ==========================================

CREATE TABLE IF NOT EXISTS vocabulary (
  word_id VARCHAR(100) PRIMARY KEY,
  tu VARCHAR(255) NOT NULL,
  nghia TEXT NOT NULL,
  phien_am VARCHAR(255),
  loai_tu VARCHAR(100),
  vi_du TEXT,
  vi_du_dich TEXT,
  nghia_tieng_han TEXT,
  nghia_tieng_anh TEXT,
  phien_am_tieng_han VARCHAR(255),
  audio_url TEXT,
  hinh_url TEXT,
  ngon_ngu VARCHAR(10) NOT NULL DEFAULT 'en',
  chu_de VARCHAR(100),
  cap_do VARCHAR(100),
  nguon_goc VARCHAR(255),
  srs_box INT DEFAULT 0,
  srs_next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  srs_interval INT DEFAULT 0,
  srs_ease FLOAT DEFAULT 2.5,
  times_reviewed INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  user_id VARCHAR(100) DEFAULT 'user_1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocab_lang ON vocabulary(ngon_ngu);
CREATE INDEX IF NOT EXISTS idx_vocab_word ON vocabulary(tu);

CREATE TABLE IF NOT EXISTS grammar (
  grammar_id VARCHAR(100) PRIMARY KEY,
  cau_truc VARCHAR(255) NOT NULL,
  giai_thich TEXT NOT NULL,
  vi_du TEXT,
  vi_du_dich TEXT,
  ngon_ngu VARCHAR(10) NOT NULL DEFAULT 'en',
  cap_do VARCHAR(100),
  chu_de VARCHAR(100),
  luu_y TEXT,
  so_sanh TEXT,
  bai_tap JSONB,
  user_id VARCHAR(100) DEFAULT 'user_1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_lang ON grammar(ngon_ngu);
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(schemaSql);
  });

  app.post('/api/database/export-sql', (req, res) => {
    try {
      const vocab = memoryStore.vocabulary || [];
      const grammar = memoryStore.grammar || [];

      let sql = `-- Polyglot Hub SQL Dump (${new Date().toISOString()})\n\n`;
      sql += `BEGIN;\n\n`;

      // Vocab inserts
      vocab.forEach((v) => {
        const escapeSql = (str: any) => (str ? `'${String(str).replace(/'/g, "''")}'` : 'NULL');
        sql += `INSERT INTO vocabulary (word_id, tu, nghia, phien_am, loai_tu, vi_du, vi_du_dich, nghia_tieng_han, nghia_tieng_anh, ngon_ngu, chu_de, cap_do, srs_box, times_reviewed, times_correct)
VALUES (${escapeSql(v.word_id)}, ${escapeSql(v.tu)}, ${escapeSql(v.nghia)}, ${escapeSql(v.phien_am)}, ${escapeSql(v.loai_tu)}, ${escapeSql(v.vi_du)}, ${escapeSql(v.vi_du_dich)}, ${escapeSql(v.nghia_tieng_han)}, ${escapeSql(v.nghia_tieng_anh)}, ${escapeSql(v.ngon_ngu)}, ${escapeSql(v.chu_de)}, ${escapeSql(v.cap_do)}, ${v.srs_box || 0}, ${v.times_reviewed || 0}, ${v.times_correct || 0})
ON CONFLICT (word_id) DO UPDATE SET tu = EXCLUDED.tu, nghia = EXCLUDED.nghia, nghia_tieng_han = EXCLUDED.nghia_tieng_han, nghia_tieng_anh = EXCLUDED.nghia_tieng_anh;\n`;
      });

      // Grammar inserts
      grammar.forEach((g) => {
        const escapeSql = (str: any) => (str ? `'${String(str).replace(/'/g, "''")}'` : 'NULL');
        sql += `INSERT INTO grammar (grammar_id, cau_truc, giai_thich, vi_du, vi_du_dich, ngon_ngu, cap_do, chu_de, luu_y)
VALUES (${escapeSql(g.grammar_id)}, ${escapeSql(g.cau_truc)}, ${escapeSql(g.giai_thich || g.y_nghia)}, ${escapeSql(g.vi_du)}, ${escapeSql(g.vi_du_dich)}, ${escapeSql(g.ngon_ngu)}, ${escapeSql(g.cap_do)}, ${escapeSql(g.chu_de)}, ${escapeSql(g.luu_y)})
ON CONFLICT (grammar_id) DO UPDATE SET cau_truc = EXCLUDED.cau_truc, giai_thich = EXCLUDED.giai_thich;\n`;
      });

      sql += `\nCOMMIT;\n`;

      res.setHeader('Content-Type', 'application/sql; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="polyglot_hub_database_backup.sql"');
      res.send(sql);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Lỗi xuất file SQL' });
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
