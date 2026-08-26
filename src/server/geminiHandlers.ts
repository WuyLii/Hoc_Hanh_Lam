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

export async function handleChat(body: any) {
  const { messages, language, imageBase64, imageMime } = body;
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

  return { reply: response.text || '' };
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

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  return JSON.parse(response.text || '{}');
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

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
    },
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

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  return JSON.parse(response.text || '{}');
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

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  return JSON.parse(response.text || '{}');
}

export async function handleOcrExtract(body: any) {
  const { imageBase64, imageMime, language } = body;
  const ai = getGenAI();
  const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';

  const prompt = `Phân tích hình ảnh này (chụp sách, bài báo, biển hiệu, phụ đề hoặc bài tập trong ${langName}).
Nhiệm vụ:
1. Đọc và trích xuất tất cả các từ vựng mới, từ khoá quan trọng, cụm từ đáng học xuất hiện trong ảnh.
2. Trả về danh sách JSON chứa các từ vựng đó để người dùng có thể thêm ngay vào kho từ vựng cá nhân:
{
  "extractedText": "Toàn bộ đoạn văn bản chính đọc được từ ảnh",
  "summary": "Tóm tắt ngắn gọn nội dung ảnh bằng tiếng Việt",
  "words": [
    {
      "tu": "từ hoặc cụm từ trích xuất",
      "nghia": "nghĩa tiếng Việt chính xác theo ngữ cảnh ảnh",
      "phien_am": "phiên âm (IPA / Romaja / Pinyin)",
      "loai_tu": "danh từ/động từ/tính từ...",
      "vi_du": "câu xuất hiện trong ảnh hoặc câu mẫu",
      "vi_du_dich": "dịch nghĩa câu ví dụ",
      "cap_do": "cấp độ ước lượng (A1-C2 / TOPIK 1-6 / HSK 1-6)",
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

  return JSON.parse(response.text || '{}');
}
