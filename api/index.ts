import express from 'express';
import {
  handleChat,
  handleGenerateExample,
  handleRoleplay,
  handleCheckJournal,
  handleGenerateMockTest,
  handleOcrExtract,
  handleExtractTextbook,
  handleFillMissingBilingual,
  handleDictionaryLookup,
  getKeysStatus,
} from '../src/server/geminiHandlers.ts';
import { fetchPublicSpreadsheet } from '../src/server/sheetsHelper.ts';
import { cleanDeduplicateVocab, cleanDeduplicateGrammar } from '../src/utils/deduplicate.ts';
import { INITIAL_VOCABULARY, INITIAL_GRAMMAR } from '../src/data/seedData.ts';
import { handleTutorAgent } from '../src/server/tutorAgent.ts';

const app = express();
app.use(express.json({ limit: '25mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-id, x-gemini-key-1, x-gemini-key-2');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (!req.url.startsWith('/api') && req.url.startsWith('/')) {
    req.url = '/api' + req.url;
  }
  next();
});

// In-memory store for Vercel serverless instance with initial seed data
let memoryStore: Record<string, any> = {
  vocabulary: Array.isArray(INITIAL_VOCABULARY) ? cleanDeduplicateVocab(INITIAL_VOCABULARY) : [],
  grammar: Array.isArray(INITIAL_GRAMMAR) ? cleanDeduplicateGrammar(INITIAL_GRAMMAR) : [],
  decks: [],
  reviewSessions: [],
  mockTests: [],
  listeningExercises: [],
  progressLogs: [],
  journalEntries: [],
  notifications: [],
  chatHistory: [],
  lastUpdated: new Date().toISOString(),
};

// 0. Gemini API Keys & Architecture Status
app.get('/api/gemini/keys-status', (req, res) => {
  try {
    const status = getKeysStatus({ headers: req.headers });
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi kiểm tra trạng thái khóa API' });
  }
});

// 1. Cloud Store Sync & Stream
app.get('/api/sync/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'close');
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', lastUpdated: memoryStore.lastUpdated })}\n\n`);
  res.end();
});

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
      Object.keys(store).forEach((key) => {
        if (store[key] !== undefined && store[key] !== null) {
          memoryStore[key] = store[key];
        }
      });
      if (memoryStore.vocabulary) memoryStore.vocabulary = cleanDeduplicateVocab(memoryStore.vocabulary);
      if (memoryStore.grammar) memoryStore.grammar = cleanDeduplicateGrammar(memoryStore.grammar);
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

app.post('/api/sync/clear-all', (req, res) => {
  try {
    memoryStore = {
      vocabulary: [],
      grammar: [],
      decks: [],
      reviewSessions: [],
      mockTests: [],
      listeningExercises: [],
      progressLogs: [],
      journalEntries: [],
      notifications: [],
      chatHistory: [],
      lastUpdated: new Date().toISOString(),
      isCleared: true,
    };
    res.json({
      success: true,
      message: 'Đã xóa sạch toàn bộ dữ liệu trên hệ thống máy chủ Cloud',
      isCleared: true,
      lastUpdated: memoryStore.lastUpdated,
    });
  } catch (err: any) {
    console.error('Error in Vercel /api/sync/clear-all:', err);
    res.status(500).json({ error: 'Lỗi khi xóa dữ liệu trên máy chủ' });
  }
});

app.post('/api/sync/delete-words', (req, res) => {
  try {
    const { wordIds } = req.body;
    if (Array.isArray(wordIds) && wordIds.length > 0) {
      const idSet = new Set(wordIds);
      if (Array.isArray(memoryStore.vocabulary)) {
        memoryStore.vocabulary = memoryStore.vocabulary.filter((w: any) => !idSet.has(w.word_id));
      }
      memoryStore.lastUpdated = new Date().toISOString();
    }
    res.json({ success: true, count: wordIds?.length || 0, store: memoryStore });
  } catch (err: any) {
    console.error('Error in Vercel /api/sync/delete-words:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync/delete-grammar', (req, res) => {
  try {
    const { grammarIds } = req.body;
    if (Array.isArray(grammarIds) && grammarIds.length > 0) {
      const idSet = new Set(grammarIds);
      if (Array.isArray(memoryStore.grammar)) {
        memoryStore.grammar = memoryStore.grammar.filter((g: any) => !idSet.has(g.grammar_id));
      }
      memoryStore.lastUpdated = new Date().toISOString();
    }
    res.json({ success: true, count: grammarIds?.length || 0, store: memoryStore });
  } catch (err: any) {
    console.error('Error in Vercel /api/sync/delete-grammar:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync/reset-all-retention', (req, res) => {
  try {
    const { lang } = req.body || {};
    if (Array.isArray(memoryStore.vocabulary)) {
      memoryStore.vocabulary = memoryStore.vocabulary.map((w: any) => {
        if (!lang || w.ngon_ngu === lang) {
          return {
            ...w,
            retention_level: 'chua_danh_gia',
            srs_box: 0,
            srs_interval: 0,
            times_reviewed: 0,
            times_correct: 0,
            last_reviewed: null,
          };
        }
        return w;
      });
      memoryStore.lastUpdated = new Date().toISOString();
    }
    res.json({
      success: true,
      message: 'Đã gán tất cả từ vựng về trạng thái Chưa đánh giá trên Cloud',
      total: (memoryStore.vocabulary || []).length,
      lastUpdated: memoryStore.lastUpdated,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Lỗi đặt lại mức độ ghi nhớ' });
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
        memoryStore.vocabulary = cleanDeduplicateVocab([...(memoryStore.vocabulary || []), ...vocab]);
      }
      const gram = resData.data.grammar;
      if (Array.isArray(gram) && gram.length > 0) {
        memoryStore.grammar = cleanDeduplicateGrammar([...(memoryStore.grammar || []), ...gram]);
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
    const result = await handleOcrExtract(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    console.error('Error in Vercel API /api/gemini/ocr-extract:', error);
    res.status(500).json({ error: error?.message || 'Lỗi khi trích xuất OCR' });
  }
});

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const result = await handleChat(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi chat AI' });
  }
});

app.post('/api/tutor/agent', async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const result = await handleTutorAgent(req.body, req.headers, clientIp);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi xử lý tác vụ Gia sư AI' });
  }
});

app.post('/api/gemini/generate-example', async (req, res) => {
  try {
    const result = await handleGenerateExample(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi tạo ví dụ' });
  }
});

app.post('/api/gemini/roleplay', async (req, res) => {
  try {
    const result = await handleRoleplay(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi roleplay' });
  }
});

app.post('/api/gemini/check-journal', async (req, res) => {
  try {
    const result = await handleCheckJournal(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi chấm bài' });
  }
});

app.post('/api/gemini/correct-journal', async (req, res) => {
  try {
    const result = await handleCheckJournal(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi chấm bài' });
  }
});

app.post('/api/gemini/mock-test', async (req, res) => {
  try {
    const result = await handleGenerateMockTest(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi tạo đề thi' });
  }
});

app.post('/api/gemini/generate-mock-test', async (req, res) => {
  try {
    const result = await handleGenerateMockTest(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Lỗi tạo đề thi' });
  }
});

app.post('/api/gemini/extract-textbook', async (req, res) => {
  try {
    const result = await handleExtractTextbook(req.body, req.headers);
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

// 7b. AI Auto-fill Missing Bilingual Cross-meanings
app.post('/api/gemini/fill-missing-bilingual', async (req, res) => {
  try {
    const result = await handleFillMissingBilingual(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    console.error('Error in Vercel API /api/gemini/fill-missing-bilingual:', error);
    res.status(500).json({ error: error?.message || 'Lỗi khi bổ sung nghĩa song ngữ đối ứng' });
  }
});

// 7.5. Deep Academic Bilingual Dictionary Lookup (2 Dedicated Isolated Models)
app.post('/api/gemini/dictionary-lookup', async (req, res) => {
  try {
    const result = await handleDictionaryLookup(req.body, req.headers);
    res.json(result);
  } catch (error: any) {
    console.error('Error in Vercel API /api/gemini/dictionary-lookup:', error);
    res.status(500).json({ error: error?.message || 'Lỗi khi tra cứu từ điển' });
  }
});

// Direct Vocabulary REST Endpoints
app.get('/api/vocabulary', (req, res) => {
  try {
    const { lang, search, topic, level, limit, page } = req.query;
    let list = memoryStore.vocabulary || [];
    if (lang) {
      list = list.filter((item: any) => item.ngon_ngu === lang);
    }
    if (topic && topic !== 'ALL') {
      list = list.filter((item: any) => item.chu_de === topic);
    }
    if (level && level !== 'ALL') {
      list = list.filter((item: any) => item.cap_do === level || (item.cap_do && item.cap_do.includes(String(level))));
    }
    if (search) {
      const q = String(search).toLowerCase().trim();
      list = list.filter((item: any) =>
        (item.tu && item.tu.toLowerCase().includes(q)) ||
        (item.nghia && item.nghia.toLowerCase().includes(q)) ||
        (item.phien_am && item.phien_am.toLowerCase().includes(q))
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
    if (!Array.isArray(memoryStore.vocabulary)) {
      memoryStore.vocabulary = [];
    }
    memoryStore.vocabulary = cleanDeduplicateVocab([item, ...memoryStore.vocabulary]);
    memoryStore.lastUpdated = new Date().toISOString();
    res.json({ success: true, item, total: memoryStore.vocabulary.length });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Lỗi lưu từ vựng' });
  }
});

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found on Vercel API' });
});

export default app;

