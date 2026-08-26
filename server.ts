import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // 1. General Language AI Chat & Multi-modal Image Analysis
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { messages, language, targetLanguage, imageBase64, imageMime } = req.body;
      const ai = getGenAI();

      const langName = language === 'en' ? 'English (Tiếng Anh)' : language === 'ko' ? 'Korean (Tiếng Hàn)' : 'Chinese (Tiếng Trung)';

      const systemInstruction = `Bạn là trợ lý AI chuyên gia giáo dục ngôn ngữ cho ứng dụng Polyglot Hub học 3 thứ tiếng: Tiếng Anh, Tiếng Hàn, Tiếng Trung.
Ngôn ngữ người dùng đang tập trung hỏi hoặc học hiện tại: ${langName}.
Nhiệm vụ của bạn:
1. Giải đáp chi tiết, dễ hiểu, thân thiện bằng Tiếng Việt về: ngữ pháp, cách dùng từ, phân biệt từ đồng nghĩa, nguồn gốc từ, văn hoá giao tiếp, dịch câu, sửa lỗi câu người dùng tự đặt.
2. Với tiếng Anh: cung cấp phiên âm IPA chuẩn.
3. Với tiếng Hàn: cung cấp chữ Hangul, phiên âm Romaja và kính ngữ (반말 / 존댓말).
4. Với tiếng Trung: cung cấp chữ Hán (Giản thể / Phồn thể), phiên âm Pinyin có dấu thanh và bộ thủ.
5. Nếu trong câu trả lời có các từ vựng hoặc cấu trúc câu mới tiêu biểu đáng học, hãy đính kèm ở cuối phản hồi một danh sách JSON theo định dạng chuẩn:
---VOCAB_SUGGESTIONS---
[
  {
    "word": "từ",
    "meaning": "nghĩa tiếng Việt",
    "phonetic": "phiên âm",
    "type": "noun/verb/adj...",
    "example": "câu ví dụ",
    "exampleVi": "dịch câu ví dụ",
    "level": "A1/TOPIK 1/HSK 1..."
  }
]
---END_VOCAB_SUGGESTIONS---
(Lưu ý: Nếu không có từ mới nổi bật, không cần xuất khối JSON này). Trả lời định dạng Markdown đẹp mắt, rõ ràng.`;

      let contents: any[] = [];

      if (Array.isArray(messages) && messages.length > 0) {
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          if (i === messages.length - 1 && imageBase64) {
            contents.push({
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
                    mimeType: imageMime || 'image/jpeg',
                  },
                },
                { text: msg.content || 'Hãy phân tích hình ảnh này và giải thích từ vựng, ngữ pháp hoặc dịch nội dung trong ảnh.' },
              ],
            });
          } else {
            contents.push({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            });
          }
        }
      } else {
        contents = [{ role: 'user', parts: [{ text: 'Xin chào! Hãy giới thiệu bạn có thể giúp gì cho tôi khi học Tiếng Anh, Hàn, Trung.' }] }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ reply: response.text || '' });
    } catch (error: any) {
      console.error('Error in /api/gemini/chat:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi kết nối với AI' });
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ reply: response.text || '' });
    } catch (error: any) {
      console.error('Error in /api/gemini/roleplay:', error);
      res.status(500).json({ error: error?.message || 'Lỗi hội thoại tình huống' });
    }
  });

  // 4. Learning Journal Grammar & Phrasing Review
  app.post('/api/gemini/check-journal', async (req, res) => {
    try {
      const { text, language, promptTopic } = req.body;
      const ai = getGenAI();

      const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';

      const prompt = `Bạn là giảng viên hiệu đính ngôn ngữ chuyên nghiệp cho bài nhật ký học tập (${langName}).
Chủ đề (nếu có): ${promptTopic || 'Tự do'}
Nội dung người học viết:
"""
${text}
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonText = response.text || '{}';
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      console.error('Error in /api/gemini/check-journal:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi kiểm tra nhật ký' });
    }
  });

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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonText = response.text || '{}';
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      console.error('Error in /api/gemini/generate-mock-test:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi tạo đề thi thử' });
    }
  });

  // 6. OCR Photo Extractor to Vocabulary Deck
  app.post('/api/gemini/ocr-extract', async (req, res) => {
    try {
      const { imageBase64, imageMime, language } = req.body;
      const ai = getGenAI();

      const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';

      const prompt = `Phân tích hình ảnh này (${langName}). Trả về danh sách JSON chứa các từ vựng trích xuất:
{
  "extractedText": "Toàn bộ văn bản đọc được",
  "summary": "Tóm tắt",
  "words": [
    {
      "tu": "từ",
      "nghia": "nghĩa",
      "phien_am": "phiên âm",
      "loai_tu": "danh từ/động từ...",
      "vi_du": "câu ví dụ",
      "vi_du_dich": "dịch",
      "cap_do": "A1",
      "chu_de": "chủ đề"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
                  mimeType: imageMime || 'image/jpeg',
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonText = response.text || '{}';
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      console.error('Error in /api/gemini/ocr-extract:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi trích xuất từ ảnh' });
    }
  });

  // 7. Large Textbook & Language Book Full AI Extractor
  app.post('/api/gemini/extract-textbook', async (req, res) => {
    try {
      const {
        fileBase64,
        fileMime,
        rawText,
        fileName,
        language,
        extractMode,
        customInstruction,
      } = req.body;

      const ai = getGenAI();

      const targetLangName =
        language === 'en'
          ? 'Tiếng Anh (English)'
          : language === 'ko'
          ? 'Tiếng Hàn (한국어)'
          : language === 'zh'
          ? 'Tiếng Trung (中文)'
          : 'Đa ngôn ngữ';

      const prompt = `Bạn là chuyên gia ngôn ngữ học và trợ lý AI cao cấp chuyên phân tích, bóc tách sách giáo khoa, giáo trình ngoại ngữ (${targetLangName}).
Tài liệu: ${fileName || 'Sách giáo khoa'}.
Chế độ: ${extractMode === 'vocab' ? 'Chỉ từ vựng' : extractMode === 'grammar' ? 'Chỉ ngữ pháp' : 'Toàn diện'}.
${customInstruction ? `Yêu cầu: ${customInstruction}` : ''}

Trả về JSON thuần tuý:
{
  "bookTitle": "Tên sách",
  "detectedLanguage": "${language || 'ko'}",
  "level": "Cấp độ",
  "totalUnits": 5,
  "summary": "Tóm tắt",
  "unitList": ["Bài 1"],
  "vocabulary": [
    {
      "tu": "từ",
      "nghia": "nghĩa",
      "phien_am": "phiên âm",
      "loai_tu": "loại từ",
      "unit": "Bài 1",
      "vi_du": "ví dụ",
      "vi_du_dich": "dịch",
      "cap_do": "TOPIK 1",
      "chu_de": "chủ đề"
    }
  ],
  "grammar": [
    {
      "cau_truc": "cấu trúc",
      "giai_thich": "giải thích",
      "cong_thuc": "công thức",
      "unit": "Bài 1",
      "cap_do": "Sơ cấp 1",
      "vi_du": "ví dụ",
      "vi_du_dich": "dịch",
      "ghi_chu": "ghi chú"
    }
  ]
}`;

      let contents: any[] = [];

      if (fileBase64 && fileMime) {
        contents.push({
          role: 'user',
          parts: [
            {
              inlineData: {
                data: fileBase64.replace(/^data:[^;]+;base64,/, ''),
                mimeType: fileMime,
              },
            },
            { text: prompt },
          ],
        });
      } else if (rawText) {
        contents.push({
          role: 'user',
          parts: [
            {
              text: `${prompt}\n\n================ NỘI DUNG TÀI LIỆU ================\n${rawText}`,
            },
          ],
        });
      } else {
        return res.status(400).json({ error: 'Vui lòng cung cấp file hoặc văn bản sách.' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonText = response.text || '{}';
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      console.error('Error in /api/gemini/extract-textbook:', error);
      res.status(500).json({ error: error?.message || 'Lỗi khi xử lý bóc tách sách' });
    }
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
