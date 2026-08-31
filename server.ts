import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { handleOcrExtract, handleExtractTextbook, formatGeminiError } from './src/server/geminiHandlers.ts';
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

  // Initialize Google GenAI
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  const callGemini = async (ai: GoogleGenAI, contents: any, config?: any) => {
    const models = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
    ];

    let lastErr: any = null;

    for (const model of models) {
      let attempts = 0;
      const maxAttempts = 2;
      while (attempts < maxAttempts) {
        try {
          attempts++;
          const res = await ai.models.generateContent({
            model,
            contents,
            config,
          });
          if (res && res.text) return res;
        } catch (err: any) {
          lastErr = err;
          const errMsg = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
          const isTransient =
            errMsg.includes('503') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('high demand') ||
            errMsg.includes('429') ||
            errMsg.includes('Quota') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('Deadline') ||
            errMsg.includes('overloaded');

          if (isTransient && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, attempts * 1000));
          } else {
            break;
          }
        }
      }
    }

    throw new Error(formatGeminiError(lastErr));
  };

  // 1. General Language AI Chat & Multi-modal Image Analysis
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { messages, language, targetLanguage, imageBase64, imageMime, responseLength, mode } = req.body;
      const ai = getGenAI();

      const langName = language === 'en' ? 'English (Tiếng Anh)' : language === 'ko' ? 'Korean (Tiếng Hàn)' : 'Chinese (Tiếng Trung)';

      const lengthDirective = responseLength === 'short'
        ? '⚡ QUY ĐỊNH ĐỘ DÀI: TRẢ LỜI NGẮN GỌN (Short Mode). Hãy trả lời cực kỳ súc tích, ngắn gọn, đi thẳng vào đáp án chính hoặc bản dịch cốt lõi (dưới 3-4 câu).'
        : '📚 QUY ĐỊNH ĐỘ DÀI: TRẢ LỜI CHI TIẾT (Long Mode). Hãy đóng vai một Gia sư AI cá nhân thực thụ, giải thích tận tình, dịch đầy đủ toàn vẹn, phân tích chi tiết từng thành phần ngữ pháp, từ vựng, phiên âm, ví dụ tự nhiên và mẹo nhớ.';

      const systemInstruction = `Bạn là Gia sư AI cá nhân chuyên sâu (AI Personal Language Tutor) cho ứng dụng Polyglot Hub học 3 ngôn ngữ: Tiếng Anh, Tiếng Hàn, Tiếng Trung.
Ngôn ngữ người học đang tập trung hiện tại: ${langName}.

${lengthDirective}

Nhiệm vụ của Gia sư AI:
1. Đóng vai gia sư thiệt sự: Luôn sẵn sàng dịch câu/đoạn văn, giải thích nghĩa từ/cấu trúc, phân biệt từ đồng nghĩa, sửa lỗi sai người dùng đặt câu, hướng dẫn giao tiếp, hoặc nhập vai trò chuyện thực tế.
2. Khi được yêu cầu DỊCH: Hãy dịch toàn vẹn, sát nghĩa tự nhiên, kèm giải thích các cụm từ quan trọng trong câu.
3. Với Tiếng Anh: Cung cấp phiên âm IPA chuẩn cho từ/cụm từ quan trọng.
4. Với Tiếng Hàn: Cung cấp Hangul, phiên âm Romaja và kính ngữ (존댓말/반말).
5. Với Tiếng Trung: Cung cấp chữ Hán (Giản thể/Phồn thể), Pinyin có dấu thanh và bộ thủ.
6. Khi xử lý HÌNH ẢNH đính kèm (sách giáo khoa, bảng từ, đề thi): Hãy đọc toàn bộ nội dung chữ trong hình ảnh (OCR), dịch nghĩa và giải thích chi tiết các từ vựng hoặc điểm ngữ pháp có trong ảnh.

Nếu trong phản hồi có các từ vựng mới tiêu biểu đáng lưu vào sổ từ, hãy đính kèm ở cuối bài khối JSON:
---VOCAB_SUGGESTIONS---
[
  {
    "word": "từ",
    "meaning": "nghĩa tiếng Việt",
    "phonetic": "phiên âm",
    "type": "loại từ",
    "example": "ví dụ",
    "exampleVi": "dịch ví dụ"
  }
]
---END_VOCAB_SUGGESTIONS---
Trả lời bằng tiếng Việt thân thiện, rõ ràng, định dạng Markdown đẹp mắt.`;

      let contents: any[] = [];

      if (Array.isArray(messages) && messages.length > 0) {
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const isLastMsg = i === messages.length - 1;
          const msgText = msg.content || msg.text || '';
          const msgImage = isLastMsg && imageBase64 ? imageBase64 : msg.image_url || msg.image;

          if (msgImage) {
            contents.push({
              role: msg.role === 'assistant' || msg.sender === 'ai' ? 'model' : 'user',
              parts: [
                {
                  inlineData: {
                    data: msgImage.replace(/^data:image\/[a-z0-9\+\.-]+;base64,/, ''),
                    mimeType: imageMime || 'image/jpeg',
                  },
                },
                { text: msgText || 'Hãy phân tích hình ảnh này, đọc chữ (OCR) và giải thích nghĩa, ngữ pháp hoặc dịch nội dung trong ảnh.' },
              ],
            });
          } else {
            contents.push({
              role: msg.role === 'assistant' || msg.sender === 'ai' ? 'model' : 'user',
              parts: [{ text: msgText }],
            });
          }
        }
      } else {
        contents = [{ role: 'user', parts: [{ text: 'Xin chào! Hãy đóng vai Gia sư AI của tôi.' }] }];
      }

      const response = await callGemini(ai, contents, {
        systemInstruction,
        temperature: 0.7,
      });

      const replyText = response.text || '';
      let suggestedWords: any[] = [];

      // Extract suggested words if JSON block present
      const match = replyText.match(/---VOCAB_SUGGESTIONS---\s*([\s\S]*?)\s*---END_VOCAB_SUGGESTIONS---/);
      if (match && match[1]) {
        try {
          suggestedWords = JSON.parse(match[1].trim());
        } catch (e) {
          console.error('Failed to parse vocab suggestions:', e);
        }
      }

      const cleanedReply = replyText.replace(/---VOCAB_SUGGESTIONS---[\s\S]*?---END_VOCAB_SUGGESTIONS---/, '').trim();

      res.json({ reply: cleanedReply || replyText, suggestedWords });
    } catch (error: any) {
      console.error('Error in /api/gemini/chat:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi kết nối với máy chủ AI' });
    }
  });

  // 2. Vocabulary Enrichment & Auto Example Generator
  app.post('/api/gemini/generate-example', async (req, res) => {
    try {
      const { word, language, meaning } = req.body;
      const ai = getGenAI();

      const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';

      const prompt = `Hãy làm giàu thông tin cho từ vựng sau trong ${langName}:
Từ: "${word}"
Nghĩa gợi ý (nếu có): "${meaning || ''}"

Yêu cầu trả về định dạng JSON hợp lệ duy nhất với cấu trúc sau:
{
  "word": "${word}",
  "meaning": "Nghĩa tiếng Việt chuẩn, đầy đủ và tự nhiên",
  "phonetic": "Phiên âm chuẩn (IPA cho tiếng Anh, Romaja cho tiếng Hàn, Pinyin có dấu cho tiếng Trung)",
  "type": "Loại từ (Danh từ, Động từ, Tính từ, Trạng từ, Cụm từ, Liên từ...)",
  "example": "Câu ví dụ thực tế, tự nhiên sử dụng từ trên",
  "exampleVi": "Dịch nghĩa câu ví dụ sang tiếng Việt",
  "level": "Cấp độ đề xuất (A1, A2, B1, B2, C1, C2 cho tiếng Anh; TOPIK 1 - TOPIK 6 cho tiếng Hàn; HSK 1 - HSK 6 cho tiếng Trung)",
  "topic": "Chủ đề phù hợp (Giao tiếp, Du lịch, Công việc, Ẩm thực, Đời sống, Cảm xúc, Học thuật...)",
  "collocations": ["Cụm từ hay đi kèm 1", "Cụm từ 2"],
  "mnemonic": "Mẹo ghi nhớ nhanh hoặc nguồn gốc chữ/từ (nếu có)",
  "synonyms": ["Từ đồng nghĩa 1", "Từ đồng nghĩa 2"]
}`;

      const response = await callGemini(ai, prompt, {
        responseMimeType: 'application/json',
      });

      const jsonText = response.text || '{}';
      const parsed = JSON.parse(jsonText);
      res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/gemini/generate-example:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi tạo dữ liệu từ vựng' });
    }
  });

  // 3. Situational Roleplay Conversation
  app.post('/api/gemini/roleplay', async (req, res) => {
    try {
      const { scenario, language, messages, userLevel } = req.body;
      const ai = getGenAI();

      const langName = language === 'en' ? 'English' : language === 'ko' ? 'Korean (한국어)' : 'Chinese (中文)';

      const systemInstruction = `You are an interactive conversational language tutor roleplaying in ${langName}.
Current Scenario: ${scenario.title} (${scenario.description}).
Your role: ${scenario.aiRole}.
User role: ${scenario.userRole}.
User Target Level: ${userLevel || 'Intermediate'}.

Guidelines:
1. Respond in natural ${langName} keeping the roleplay active and engaging.
2. Keep responses appropriate for the user's level (1-3 sentences per turn).
3. At the end of your response, ALWAYS include a JSON block for evaluation and hints in this exact format:
---FEEDBACK_DATA---
{
  "vietnameseTranslation": "Dịch câu thoại của AI sang tiếng Việt",
  "pronunciationGuide": "Romaja / Pinyin / IPA for AI's line",
  "suggestedReplies": [
    { "text": "Câu trả lời gợi ý 1 bằng ${langName}", "meaning": "Nghĩa tiếng Việt" },
    { "text": "Câu trả lời gợi ý 2 bằng ${langName}", "meaning": "Nghĩa tiếng Việt" }
  ],
  "userCorrection": "Nếu câu trước của người dùng có lỗi ngữ pháp/từ vựng, nhận xét ngắn gọn và cách sửa tự nhiên hơn (nếu người dùng nói tốt thì để trống null)"
}
---END_FEEDBACK_DATA---`;

      const contents: any[] = [];
      if (Array.isArray(messages) && messages.length > 0) {
        messages.forEach((m: any) => {
          contents.push({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          });
        });
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: `[Bắt đầu tình huống: ${scenario.title}. Hãy chào người dùng bằng ${langName} theo đúng vai diễn của bạn].` }],
        });
      }

      const response = await callGemini(ai, contents, {
        systemInstruction,
        temperature: 0.7,
      });

      res.json({ reply: response.text || '' });
    } catch (error: any) {
      console.error('Error in /api/gemini/roleplay:', error);
      res.status(500).json({ error: error?.message || 'Lỗi hội thoại tình huống' });
    }
  });

  // 4. Learning Journal Grammar & Phrasing Review
  const handleJournalCheck = async (req: express.Request, res: express.Response) => {
    try {
      const { text, content, language, promptTopic } = req.body;
      const journalText = text || content;
      const ai = getGenAI();

      const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';

      const prompt = `Bạn là giảng viên hiệu đính ngôn ngữ chuyên nghiệp cho bài nhật ký học tập (${langName}).
Chủ đề (nếu có): ${promptTopic || 'Tự do'}
Nội dung người học viết:
"""
${journalText}
"""

Hãy đánh giá chi tiết và trả về kết quả định dạng JSON thuần tuý:
{
  "score": 85,
  "summary": "Lời khen ngợi và nhận xét tổng quan ngắn gọn truyền cảm hứng bằng tiếng Việt",
  "corrections": [
    {
      "original": "đoạn sai hoặc chưa tự nhiên",
      "corrected": "cách sửa chuẩn và tự nhiên",
      "explanation": "giải thích chi tiết vì sao nên sửa như vậy bằng tiếng Việt"
    }
  ],
  "improvedVersion": "Toàn bộ bài viết đã được chỉnh sửa chuẩn, mượt mà và tự nhiên nhất",
  "vocabularyUpgrades": [
    {
      "basic": "từ đơn giản người dùng đã dùng",
      "advanced": "từ nâng cao/tự nhiên hơn nên dùng thay thế",
      "meaning": "nghĩa tiếng Việt"
    }
  ],
  "encouragement": "Lời động viên cho buổi học tiếp theo"
}`;

      const response = await callGemini(ai, prompt, {
        responseMimeType: 'application/json',
      });

      const jsonText = response.text || '{}';
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      console.error('Error in journal check endpoint:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi kiểm tra nhật ký' });
    }
  };

  app.post('/api/gemini/check-journal', handleJournalCheck);
  app.post('/api/gemini/correct-journal', handleJournalCheck);

  // 5. Dynamic Standardized Mock Test Generator (TOEIC/IELTS, TOPIK, HSK)
  app.post('/api/gemini/generate-mock-test', async (req, res) => {
    try {
      const { testType, language, level, wordList } = req.body;
      const ai = getGenAI();

      let typePrompt = '';
      if (language === 'en') {
        typePrompt = `Mô phỏng đề kiểm tra Tiếng Anh định dạng ${testType || 'TOEIC/CEFR'} cấp độ ${level || 'B1-B2'}. Gồm 5 câu hỏi trắc nghiệm đa dạng: từ vựng trong ngữ cảnh, ngữ pháp điền khuyết, chọn từ đồng nghĩa, và hoàn thành câu.`;
      } else if (language === 'ko') {
        typePrompt = `Mô phỏng đề kiểm tra Tiếng Hàn định dạng ${testType || 'TOPIK'} cấp độ ${level || 'TOPIK 2-3'}. Gồm 5 câu hỏi trắc nghiệm: 빈칸에 들어갈 알맞은 말 (Điền từ vào chỗ trống), 밑줄 친 부분과 의미가 비슷한 것 (Tìm từ đồng nghĩa), 문법 구조 (Ngữ pháp).`;
      } else {
        typePrompt = `Mô phỏng đề kiểm tra Tiếng Trung định dạng ${testType || 'HSK'} cấp độ ${level || 'HSK 3-4'}. Gồm 5 câu hỏi trắc nghiệm: 选词填空 (Chọn từ điền khuyết), 词语搭配 (Kết hợp từ), 语法辨析 (Phân tích ngữ pháp), 汉字拼音 (Nhận diện chữ Hán & Pinyin).`;
      }

      const wordsContext = Array.isArray(wordList) && wordList.length > 0
        ? `Ưu tiên lồng ghép các từ vựng này vào câu hỏi: ${wordList.map((w: any) => `${w.tu} (${w.nghia})`).join(', ')}`
        : '';

      const prompt = `Hãy tạo một đề kiểm tra ngắn gồm 5 câu hỏi theo yêu cầu:
${typePrompt}
${wordsContext}

Trả về định dạng JSON thuần tuý với cấu trúc:
{
  "testTitle": "Tên đề thi",
  "language": "${language}",
  "level": "${level}",
  "timeLimitSeconds": 300,
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Nội dung câu hỏi",
      "phoneticOrTranslation": "Phiên âm hoặc dịch nghĩa",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Giải thích chi tiết",
      "targetWord": "từ trọng tâm"
    }
  ]
}`;

      const response = await callGemini(ai, prompt, {
        responseMimeType: 'application/json',
      });

      const jsonText = response.text || '{}';
      res.json(JSON.parse(jsonText));
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
