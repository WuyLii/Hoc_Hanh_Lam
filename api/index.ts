import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '25mb' }));

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
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


// Let's mount the core OCR and AI endpoints directly in api/index.ts so Vercel serverless functions work 100% reliably without path resolution issues!
app.post('/api/gemini/ocr-extract', async (req, res) => {
  try {
    const { imageBase64, images, language } = req.body;
    const ai = getGenAI();

    const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';

    const prompt = `Phân tích toàn bộ các hình ảnh tài liệu/sách giáo khoa (${langName}) được cung cấp. Trả về danh sách JSON chứa các từ vựng trích xuất từ tất cả các ảnh:
{
  "extractedText": "Tóm tắt văn bản đọc được từ các ảnh",
  "summary": "Tóm tắt",
  "words": [
    {
      "word": "từ vựng",
      "phonetic": "phiên âm",
      "meaning": "nghĩa tiếng việt",
      "type": "noun/verb/adj",
      "example": "ví dụ câu",
      "exampleVi": "dịch ví dụ",
      "level": "A1/TOPIK 1/HSK 1..."
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
      return res.status(400).json({ error: 'Không tìm thấy hình ảnh nào được tải lên.' });
    }

    const parts: any[] = [];
    imageList.forEach((img) => {
      parts.push({
        inlineData: {
          data: img.replace(/^data:image\/[a-z0-9\+\.-]+;base64,/, ''),
          mimeType: 'image/jpeg',
        },
      });
    });
    parts.push({ text: prompt });

    let response: any = null;
    let attempts = 0;
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-2.5-flash'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      attempts = 0;
      while (attempts < 2) {
        try {
          attempts++;
          response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts }],
            config: { responseMimeType: 'application/json' },
          });
          break;
        } catch (apiErr: any) {
          lastError = apiErr;
          const is503 = apiErr?.message?.includes('503') || apiErr?.message?.includes('Deadline expired') || apiErr?.message?.includes('high demand') || apiErr?.status === 503;
          if (!is503 && attempts >= 2) break;
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      if (response && response.text) break;
    }

    if (!response || !response.text) {
      throw lastError || new Error('Không thể nhận phản hồi từ AI sau nhiều lần thử.');
    }

    const jsonText = response.text || '{}';
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error('Error in /api/gemini/ocr-extract:', error);
    const isUnavailable = error?.message?.includes('503') || error?.message?.includes('Deadline expired') || error?.message?.includes('high demand') || error?.status === 503;
    const errorMessage = isUnavailable
      ? 'Hệ thống AI đang quá tải tạm thời (Lỗi 503). Vui lòng thử lại sau giây lát hoặc giảm số lượng ảnh.'
      : (error?.message || 'Lỗi khi trích xuất từ ảnh');
    res.status(500).json({ error: errorMessage });
  }
});

// General catch-all for other /api routes or proxy to server
app.all('/api/*', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API route active' });
});

export default app;
