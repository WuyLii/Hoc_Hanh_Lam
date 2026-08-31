import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

export const getGenAI = () => {
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

export function formatGeminiError(err: any): string {
  if (!err) return 'Hệ thống AI tạm thời chưa phản hồi. Vui lòng thử lại!';
  const rawStr = typeof err === 'string' ? err : err?.message || JSON.stringify(err);

  if (
    rawStr.includes('Quota exceeded') ||
    rawStr.includes('quota') ||
    rawStr.includes('429') ||
    rawStr.includes('RESOURCE_EXHAUSTED') ||
    rawStr.includes('rate limit') ||
    rawStr.includes('limit: 0')
  ) {
    return 'Hệ thống AI vừa chạm giới hạn số lượt gửi trong 1 phút (Quota / Rate Limit - Lỗi 429). Vui lòng đợi khoảng 30–60 giây rồi bấm nút "Thử Lại"!';
  }

  if (
    rawStr.includes('503') ||
    rawStr.includes('UNAVAILABLE') ||
    rawStr.includes('high demand') ||
    rawStr.includes('overloaded')
  ) {
    return 'Hệ thống AI Gemini từ Google đang quá tải tạm thời (Lỗi 503 High Demand). Vui lòng bấm nút "Thử Lại" sau 10 - 15 giây!';
  }

  if (rawStr.includes('GEMINI_API_KEY')) {
    return 'Chưa cấu hình GEMINI_API_KEY hợp lệ trên môi trường máy chủ.';
  }

  try {
    const parsedErr = JSON.parse(rawStr);
    if (parsedErr?.error?.message) {
      const msg = parsedErr.error.message;
      if (
        msg.includes('Quota') ||
        msg.includes('quota') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED')
      ) {
        return 'Hệ thống AI vừa chạm giới hạn số lượt gửi trong 1 phút (Quota / Rate Limit - Lỗi 429). Vui lòng đợi khoảng 30–60 giây rồi bấm nút "Thử Lại"!';
      }
      return msg;
    }
  } catch (_) {}

  return 'Hệ thống AI đang phản hồi chậm hoặc quá tải. Vui lòng bấm nút "Thử Lại" sau ít giây!';
}

export async function callGeminiWithRetry(ai: GoogleGenAI, contents: any, config?: any) {
  const modelsToTry = [
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
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
        if (res && res.text) {
          return res;
        }
      } catch (err: any) {
        lastError = err;
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

  throw new Error(formatGeminiError(lastError));
}

export function safeParseJSON(text: string) {
  if (!text) return {};
  let cleanText = text.trim();
  cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const firstBrace = cleanText.search(/[\{\[]/);
  const lastBrace = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    console.error('Failed to parse JSON from AI response:', cleanText);
    return {};
  }
}

export async function handleChat(body: any) {
  const { messages, language, imageBase64, imageMime, responseLength } = body;
  const ai = getGenAI();
  const langName = language === 'en' ? 'English (Tiếng Anh)' : language === 'ko' ? 'Korean (Tiếng Hàn)' : 'Chinese (Tiếng Trung)';

  const lengthDirective = responseLength === 'short'
    ? '⚡ QUY ĐỊNH ĐỘ DÀI: TRẢ LỜI NGẮN GỌN (Short Mode). Trả lời thật súc tích, đi thẳng vào đáp án chính hoặc bản dịch cốt lõi (dưới 3-4 câu).'
    : '📚 QUY ĐỊNH ĐỘ DÀI: TRẢ LỜI CHI TIẾT (Long Mode). Đóng vai Gia sư AI cá nhân thực thụ, giải thích tận tình, dịch đầy đủ toàn vẹn, phân tích chi tiết từng thành phần ngữ pháp, từ vựng, phiên âm, ví dụ tự nhiên và mẹo nhớ.';

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

  const response = await callGeminiWithRetry(ai, contents, {
    systemInstruction,
    temperature: 0.7,
  });

  const replyText = response.text || '';
  let suggestedWords: any[] = [];

  const match = replyText.match(/---VOCAB_SUGGESTIONS---\s*([\s\S]*?)\s*---END_VOCAB_SUGGESTIONS---/);
  if (match && match[1]) {
    try {
      suggestedWords = JSON.parse(match[1].trim());
    } catch (e) {
      console.error('Failed to parse vocab suggestions:', e);
    }
  }

  const cleanedReply = replyText.replace(/---VOCAB_SUGGESTIONS---[\s\S]*?---END_VOCAB_SUGGESTIONS---/, '').trim();

  return { reply: cleanedReply || replyText, suggestedWords };
}

export async function handleGenerateExample(body: any) {
  const { word, language, meaning } = body;
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

  const response = await callGeminiWithRetry(ai, prompt, {
    responseMimeType: 'application/json',
  });

  return safeParseJSON(response.text || '{}');
}

export async function handleRoleplay(body: any) {
  const { scenario, language, messages, userLevel } = body;
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

  const response = await callGeminiWithRetry(ai, contents, {
    systemInstruction,
    temperature: 0.7,
  });

  return { reply: response.text || '' };
}

export async function handleCheckJournal(body: any) {
  const { text, language, promptTopic } = body;
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

  const response = await callGeminiWithRetry(ai, prompt, {
    responseMimeType: 'application/json',
  });

  return safeParseJSON(response.text || '{}');
}

export async function handleGenerateMockTest(body: any) {
  const { testType, language, level, wordList } = body;
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
  "testTitle": "Tên đề thi (ví dụ: TOEIC Mini Mock Test - Part 5 / TOPIK I Đề Luyện Tập / HSK 3 Ôn Tập Tổng Hợp)",
  "language": "${language}",
  "level": "${level}",
  "timeLimitSeconds": 300,
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Nội dung câu hỏi (chứa chỗ trống ____ hoặc đoạn văn ngắn)",
      "phoneticOrTranslation": "Phiên âm hoặc dịch nghĩa sơ lược để hỗ trợ sau khi nộp bài",
      "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
      "correctIndex": 0,
      "explanation": "Giải thích chi tiết vì sao đáp án đúng và phân tích các đáp án sai bằng tiếng Việt",
      "targetWord": "từ vựng trọng tâm cần nhớ"
    }
  ]
}`;

  const response = await callGeminiWithRetry(ai, prompt, {
    responseMimeType: 'application/json',
  });

  return safeParseJSON(response.text || '{}');
}

export async function handleOcrExtract(body: any) {
  const { imageBase64, images, language } = body;
  const ai = getGenAI();
  const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';

  const levelGuide = language === 'en'
    ? 'Phân tích cấp độ chuẩn TOEIC/CEFR (ví dụ: TOEIC 500, TOEIC 650, TOEIC 800, CEFR B1, IELTS 6.0)'
    : language === 'ko'
    ? 'Phân tích cấp độ chuẩn TOPIK (ví dụ: TOPIK 1, TOPIK 2, TOPIK 3, TOPIK 4, TOPIK 5, TOPIK 6)'
    : 'Phân tích cấp độ chuẩn HSK (ví dụ: HSK 1, HSK 2, HSK 3, HSK 4, HSK 5, HSK 6)';

  const prompt = `Bạn là hệ thống OCR Chuyên sâu & Trích xuất Từ vựng Ngôn ngữ (${langName}) với độ chính xác tuyệt đối.

YÊU CẦU QUAN TRỌNG HÀNG ĐẦU - ĐỌC VÀ TRÍCH XUẤT 100% TOÀN BỘ DỮ LIỆU:
1. TRÍCH XUẤT ĐẦY ĐỦ 100% CÁC TỪ VỰNG: Hãy đọc lần lượt từng dòng, từng cột, từng ô từ góc trên trái xuống góc dưới phải của tất cả hình ảnh. Nếu ảnh chứa bảng từ vựng hoặc danh sách 40, 50, 60 hay 100 từ, bạn BẮT BUỘC TRÍCH XUẤT BẰNG HẾT TOÀN BỘ TẤT CẢ TỪ VỰNG vào mảng "words".
2. TUYỆT ĐỐI KHÔNG DỪNG LẠI GIỮA CHỪNG: KHÔNG ĐƯỢC TÓM TẮT, KHÔNG ĐƯỢC CHỈ LẤY 10-15 TỪ MẪU. Hãy kiên trì liệt kê từng từ một cho đến từ cuối cùng trong tài liệu.
3. PHÂN TÍCH TỪNG TỪ:
   - "tu": Từ/cụm từ chính xác trong ảnh (${langName}).
   - "nghia": Nghĩa Tiếng Việt đầy đủ, chuẩn xác theo ngữ cảnh bài học.
   - "phien_am": Phiên âm chuẩn (IPA cho Tiếng Anh, Romaja cho Tiếng Hàn, Pinyin có dấu thanh cho Tiếng Trung).
   - "loai_tu": Loại từ (Danh từ, Động từ, Tính từ, Trạng từ, Cụm từ...).
   - "cap_do": ${levelGuide}.
   - "chu_de": Chủ đề phù hợp (Giao tiếp, Đời sống, Công sở, Du lịch, Học thuật...).
   - "vi_du": Câu ví dụ ngắn gọn, tự nhiên minh họa từ (nếu trong ảnh có sẵn câu thì lấy trong ảnh, nếu không có thì AI tự tạo câu chuẩn).
   - "vi_du_dich": Dịch nghĩa câu ví dụ sang Tiếng Việt.

4. TRÍCH XUẤT NGỮ PHÁP (nếu có trong ảnh): Liệt kê các cấu trúc/mẫu câu xuất hiện trong ảnh vào mảng "grammar".

Trả về kết quả chuẩn JSON duy nhất với cấu trúc:
{
  "extractedText": "Ghi nhận đầy đủ 100% toàn bộ văn bản OCR đọc được từ ảnh",
  "summary": "Tóm tắt tổng số từ vựng và chủ đề chính trích xuất được từ tài liệu",
  "words": [
    {
      "tu": "từ hoặc cụm từ",
      "nghia": "nghĩa tiếng Việt",
      "phien_am": "phiên âm",
      "loai_tu": "loại từ",
      "cap_do": "TOEIC 650 / TOPIK 2 / HSK 3",
      "chu_de": "Chủ đề",
      "vi_du": "Câu ví dụ ngắn",
      "vi_du_dich": "Dịch ví dụ"
    }
  ],
  "grammar": [
    {
      "cau_truc": "Cấu trúc ngữ pháp",
      "giai_thich": "Giải thích ngắn gọn",
      "cong_thuc": "Công thức chia",
      "cap_do": "Cấp độ",
      "chu_de": "Chủ đề",
      "vi_du": "Ví dụ",
      "vi_du_dich": "Dịch ví dụ"
    }
  ]
}`;

  let imageList: string[] = [];
  if (Array.isArray(images) && images.length > 0) {
    imageList = images;
  } else if (imageBase64) {
    imageList = [imageBase64];
  }

  if (imageList.length === 0) {
    throw new Error('Không tìm thấy hình ảnh nào được tải lên.');
  }

  const parts: any[] = [];
  imageList.forEach((img) => {
    const matchMime = img.match(/^data:(image\/[a-z0-9\+\.-]+);base64,/i);
    const mimeType = matchMime ? matchMime[1] : 'image/jpeg';
    parts.push({
      inlineData: {
        data: img.replace(/^data:image\/[a-z0-9\+\.-]+;base64,/, ''),
        mimeType,
      },
    });
  });
  parts.push({ text: prompt });

  const response = await callGeminiWithRetry(ai, [{ role: 'user', parts }], {
    responseMimeType: 'application/json',
    temperature: 0.1,
    maxOutputTokens: 16384,
  });

  return safeParseJSON(response.text || '{}');
}

export async function handleExtractTextbook(body: any) {
  const {
    fileBase64,
    fileMime,
    rawText,
    fileName,
    language,
    extractMode,
    customInstruction,
  } = body;

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
    const trimmedText = rawText.length > 50000 ? rawText.substring(0, 50000) + '\n[... Văn bản đã được cắt bớt để tối ưu hóa xử lý AI ...]' : rawText;
    contents.push({
      role: 'user',
      parts: [
        {
          text: `${prompt}\n\n================ NỘI DUNG TÀI LIỆU ================\n${trimmedText}`,
        },
      ],
    });
  } else {
    throw new Error('Vui lòng cung cấp file hoặc văn bản sách.');
  }

  const response = await callGeminiWithRetry(ai, contents, {
    responseMimeType: 'application/json',
  });

  return safeParseJSON(response.text || '{}');
}
