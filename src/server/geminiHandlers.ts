import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// =========================================================================
// HỆ THỐNG QUẢN LÝ 2 MÃ NGUỒN GEMINI API (DUAL GEMINI API KEYS & LOAD BALANCING)
// Hỗ trợ đồng thời 2 API Key trên Vercel / Cloud Run / Local & Custom Keys từ Client
// Luân phiên phân tải (Round-robin) + Tự động chuyển đổi dự phòng (Auto-Failover)
// =========================================================================

export interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  masked: string;
  source: 'env_primary' | 'env_secondary' | 'client_custom_1' | 'client_custom_2';
}

export interface KeyExecutionStats {
  totalCalls: number;
  key1Calls: number;
  key2Calls: number;
  failoversCount: number;
  lastFailoverTime?: string;
  lastUsedKeyId?: string;
}

const keyStats: KeyExecutionStats = {
  totalCalls: 0,
  key1Calls: 0,
  key2Calls: 0,
  failoversCount: 0,
};

let globalKeyRotationCounter = 0;

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
}

/**
 * Thu thập tất cả các API Keys có sẵn từ biến môi trường và yêu cầu người dùng
 */
export function getAvailableApiKeys(options?: {
  customApiKey?: string;
  customApiKey2?: string;
  headers?: Record<string, any>;
}): ApiKeyItem[] {
  const keys: ApiKeyItem[] = [];
  const seen = new Set<string>();

  const addKey = (key: string | undefined, name: string, source: ApiKeyItem['source'], id: string) => {
    if (key && typeof key === 'string' && key.trim().length > 5) {
      const cleanKey = key.trim();
      if (!seen.has(cleanKey)) {
        seen.add(cleanKey);
        keys.push({
          id,
          name,
          key: cleanKey,
          masked: maskApiKey(cleanKey),
          source,
        });
      }
    }
  };

  // 1. Client-provided custom keys (if any passed in request header/body)
  const headerKey1 = options?.headers?.['x-gemini-api-key'] || options?.headers?.['x-gemini-key'];
  const headerKey2 = options?.headers?.['x-gemini-api-key-2'] || options?.headers?.['x-gemini-key-2'];

  addKey(options?.customApiKey || (typeof headerKey1 === 'string' ? headerKey1 : undefined), 'Khóa Tuỳ Chọn 1 (Client Key 1)', 'client_custom_1', 'custom-1');
  addKey(options?.customApiKey2 || (typeof headerKey2 === 'string' ? headerKey2 : undefined), 'Khóa Tuỳ Chọn 2 (Client Key 2)', 'client_custom_2', 'custom-2');

  // 2. Server Environment Keys (Primary & Secondary)
  const envKey1 = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_1;
  const envKey2 = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_BACKUP || process.env.GEMINI_BACKUP_KEY;

  addKey(envKey1, 'Mã nguồn 1 (GEMINI_API_KEY chính)', 'env_primary', 'key-1');
  addKey(envKey2, 'Mã nguồn 2 (GEMINI_API_KEY_2 dự phòng)', 'env_secondary', 'key-2');

  return keys;
}

export function createGenAIInstance(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'polyglot-hub-dual-key/2.0',
      },
    },
  });
}

export function getGenAI(options?: { customApiKey?: string; customApiKey2?: string; headers?: Record<string, any> }) {
  const keys = getAvailableApiKeys(options);
  if (keys.length === 0) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trên môi trường máy chủ hoặc Vercel.');
  }
  // Mặc định trả về key đầu tiên
  return createGenAIInstance(keys[0].key);
}

export function formatGeminiError(err: any): string {
  if (!err) return 'Hệ thống AI tạm thời chưa phản hồi. Vui lòng thử lại!';
  const rawStr = typeof err === 'string' ? err : err?.message || JSON.stringify(err);

  if (
    rawStr.includes('denied access') ||
    rawStr.includes('PERMISSION_DENIED') ||
    rawStr.includes('403') ||
    rawStr.includes('Forbidden')
  ) {
    return 'Khóa API Gemini (GEMINI_API_KEY) gặp lỗi phân quyền (403 Permission Denied). Nếu dùng trên Vercel, hãy đảm bảo đã cấu hình đúng GEMINI_API_KEY và GEMINI_API_KEY_2 trong Environment Variables.';
  }

  if (
    rawStr.includes('Quota exceeded') ||
    rawStr.includes('quota') ||
    rawStr.includes('429') ||
    rawStr.includes('RESOURCE_EXHAUSTED') ||
    rawStr.includes('rate limit') ||
    rawStr.includes('limit: 0')
  ) {
    return 'Hệ thống AI đã kích hoạt chuyển đổi giữa 2 mã nguồn API nhưng tất cả đều đang chạm giới hạn tần suất (Quota / Rate Limit - Lỗi 429). Vui lòng đợi 30–45 giây rồi thử lại!';
  }

  if (
    rawStr.includes('503') ||
    rawStr.includes('UNAVAILABLE') ||
    rawStr.includes('high demand') ||
    rawStr.includes('overloaded') ||
    rawStr.includes('Deadline')
  ) {
    return 'Hệ thống máy chủ AI đang quá tải tạm thời (Lỗi 503 High Demand). Vui lòng bấm nút "Thử Lại" sau ít giây!';
  }

  if (rawStr.includes('GEMINI_API_KEY')) {
    return 'Chưa cấu hình GEMINI_API_KEY hoặc GEMINI_API_KEY_2 hợp lệ trên môi trường Vercel/Máy chủ.';
  }

  try {
    const parsedErr = JSON.parse(rawStr);
    if (parsedErr?.error?.message) {
      const msg = parsedErr.error.message;
      if (msg.includes('Quota') || msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        return 'Hệ thống AI vừa chạm giới hạn số lượt gửi (Quota / Rate Limit - Lỗi 429). Vui lòng đợi 30 giây rồi thử lại!';
      }
      return msg;
    }
  } catch (_) {}

  return 'Hệ thống AI đang xử lý chậm hoặc quá tải. Vui lòng bấm thử lại!';
}

/**
 * Trình thực thi thông minh đa mã nguồn: Luân phiên phân tải (Load Balancing)
 * và tự động chuyển đổi sang mã nguồn dự phòng (Auto-Failover) khi xảy ra lỗi.
 */
export async function executeWithDualKeyFailover<T>(
  options: { customApiKey?: string; customApiKey2?: string; headers?: Record<string, any> } | undefined,
  taskName: string,
  fn: (ai: GoogleGenAI, keyInfo: ApiKeyItem, keyIndex: number) => Promise<T>
): Promise<{ result: T; activeKeyInfo: ApiKeyItem; keyIndex: number; totalKeys: number; failedOver: boolean }> {
  const availableKeys = getAvailableApiKeys(options);
  if (availableKeys.length === 0) {
    throw new Error('Chưa tìm thấy mã nguồn GEMINI_API_KEY nào được cấu hình trên hệ thống.');
  }

  keyStats.totalCalls++;

  // Chọn key bắt đầu theo vòng quay (Round-Robin) để chia tải đều 50-50
  const startIndex = (globalKeyRotationCounter++) % availableKeys.length;
  
  // Thứ tự duyệt key: Key ưu tiên theo vòng quay trước, sau đó là các key còn lại
  const keySequence: { item: ApiKeyItem; originalIndex: number }[] = [];
  for (let i = 0; i < availableKeys.length; i++) {
    const idx = (startIndex + i) % availableKeys.length;
    keySequence.push({ item: availableKeys[idx], originalIndex: idx + 1 });
  }

  let lastError: any = null;
  let hasFailedOver = false;

  for (let i = 0; i < keySequence.length; i++) {
    const { item, originalIndex } = keySequence[i];
    const isFailoverAttempt = i > 0;

    if (isFailoverAttempt) {
      hasFailedOver = true;
      keyStats.failoversCount++;
      keyStats.lastFailoverTime = new Date().toISOString();
      console.warn(`[DUAL-KEY AUTO-FAILOVER] Mã nguồn ${keySequence[i - 1].item.name} gặp sự cố, tự động chuyển đổi sang ${item.name} cho tác vụ "${taskName}".`);
    }

    try {
      const ai = createGenAIInstance(item.key);
      const res = await fn(ai, item, originalIndex);

      if (originalIndex === 1) keyStats.key1Calls++;
      else keyStats.key2Calls++;
      keyStats.lastUsedKeyId = item.id;

      return {
        result: res,
        activeKeyInfo: item,
        keyIndex: originalIndex,
        totalKeys: availableKeys.length,
        failedOver: hasFailedOver,
      };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[DUAL-KEY EXECUTION] Lỗi khi gọi bằng ${item.name} (${item.masked}):`, errMsg);

      // Nếu còn key dự phòng, chờ 200ms rồi lập tức thử key tiếp theo
      if (i < keySequence.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  throw new Error(formatGeminiError(lastError));
}

// =========================================================================
// PHÂN CHIA 3 NHÓM AI CHUYÊN BIỆT THEO ĐÚNG YÊU CẦU:
// =========================================================================

// =========================================================================
// NHÓM 1: GIA SƯ AI ĐỘC QUYỀN (TUTOR ONLY - ĐỘC QUYỀN TUYỆT ĐỐI)
// 2 con AI cố định thay phiên nhau từng lượt hỏi (Turn-based Alternating)
// Tuyệt đối KHÔNG BAO GIỜ được gọi bởi các tính năng khác!
// =========================================================================
export interface DedicatedModelConfig {
  id: string;
  name: string;
  model: string;
  fallbackModel?: string;
  description: string;
}

export const DEDICATED_TUTOR_MODELS: DedicatedModelConfig[] = [
  {
    id: 'tutor-1',
    name: 'Gia sư AI 1 (Gemini 3.7 Flash)',
    model: 'gemini-3.7-flash',
    fallbackModel: 'gemini-flash-latest',
    description: 'Chuyên gia Phân tích Chuyên sâu & Sư phạm Ngôn ngữ Cao cấp',
  },
  {
    id: 'tutor-2',
    name: 'Gia sư AI 2 (Gemini 3.1 Pro)',
    model: 'gemini-3.1-pro',
    fallbackModel: 'gemini-flash-latest',
    description: 'Chuyên gia Logic Ngữ nghĩa Sâu sắc & Đối chiếu Đa Ngữ',
  },
  {
    id: 'tutor-backup',
    name: 'Gia sư AI Dự phòng (Gemini Flash Lite)',
    model: 'gemini-3.1-flash-lite',
    fallbackModel: 'gemini-flash-latest',
    description: 'Dự phòng siêu tốc độ cao',
  },
];

let globalTutorTurnCounter = 0;

export async function callGeminiTutorAlternating(
  options: any,
  contents: any,
  config?: any,
  requestedTurn?: number
) {
  const currentTurn = typeof requestedTurn === 'number' ? requestedTurn : globalTutorTurnCounter++;
  const isTurn0 = currentTurn % 2 === 0;

  // Lượt chẵn: Gia sư AI 1 -> Gia sư AI 2 -> Dự phòng
  // Lượt lẻ: Gia sư AI 2 -> Gia sư AI 1 -> Dự phòng
  const tutorSequence = isTurn0
    ? [DEDICATED_TUTOR_MODELS[0], DEDICATED_TUTOR_MODELS[1], DEDICATED_TUTOR_MODELS[2]]
    : [DEDICATED_TUTOR_MODELS[1], DEDICATED_TUTOR_MODELS[0], DEDICATED_TUTOR_MODELS[2]];

  const execution = await executeWithDualKeyFailover(
    options,
    `Tutor Turn ${currentTurn + 1}`,
    async (ai, keyInfo, keyIndex) => {
      let lastModelError: any = null;

      for (const tutor of tutorSequence) {
        // Thử model chính của gia sư
        try {
          const res = await ai.models.generateContent({
            model: tutor.model,
            contents,
            config,
          });
          if (res && res.text) {
            return {
              res,
              tutorInfo: {
                id: tutor.id,
                name: tutor.name,
                model: tutor.model,
                turn: currentTurn + 1,
                activeKeyName: keyInfo.name,
                activeKeyIndex: keyIndex,
              },
            };
          }
        } catch (err: any) {
          lastModelError = err;
          // Thử fallback model của riêng con AI đó
          if (tutor.fallbackModel && tutor.fallbackModel !== tutor.model) {
            try {
              const resFallback = await ai.models.generateContent({
                model: tutor.fallbackModel,
                contents,
                config,
              });
              if (resFallback && resFallback.text) {
                return {
                  res: resFallback,
                  tutorInfo: {
                    id: tutor.id,
                    name: `${tutor.name} (Tương thích)`,
                    model: tutor.fallbackModel,
                    turn: currentTurn + 1,
                    activeKeyName: keyInfo.name,
                    activeKeyIndex: keyIndex,
                  },
                };
              }
            } catch (err2: any) {
              lastModelError = err2;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      throw lastModelError || new Error('Không thể kết nối với các mô hình Gia sư AI.');
    }
  );

  return {
    res: execution.result.res,
    tutorInfo: {
      ...execution.result.tutorInfo,
      totalKeys: execution.totalKeys,
      failedOver: execution.failedOver,
    },
  };
}

// =========================================================================
// NHÓM 2: TRA TỪ ĐIỂN AI ĐỘC QUYỀN (DICTIONARY ONLY - ĐỘC QUYỀN TUYỆT ĐỐI)
// 2 con AI cố định luân phiên phân tải & tự động dự phòng.
// Đảm bảo >100 từ/ngày tra cứu học thuật sâu sắc mà không lo hết lượt.
// Tuyệt đối KHÔNG BAO GIỜ được gọi bởi tính năng khác.
// =========================================================================
export const DEDICATED_DICTIONARY_MODELS: DedicatedModelConfig[] = [
  {
    id: 'dict-ai-1',
    name: 'Từ điển AI 1 (Gemini 3.8 Flash)',
    model: 'gemini-3.8-flash',
    fallbackModel: 'gemini-flash-latest',
    description: 'Chuyên gia Đại từ điển Học thuật, Ngữ nghĩa sâu sắc & Phiên âm quốc tế',
  },
  {
    id: 'dict-ai-2',
    name: 'Từ điển AI 2 (Gemini Flash Latest)',
    model: 'gemini-flash-latest',
    fallbackModel: 'gemini-3.7-flash',
    description: 'Chuyên gia Song ngữ Tốc độ cao, Đối chiếu Hán Việt & Dự phòng thông minh',
  },
  {
    id: 'dict-ai-lite',
    name: 'Từ điển AI 3 (Gemini Flash Lite)',
    model: 'gemini-3.1-flash-lite',
    fallbackModel: 'gemini-flash-latest',
    description: 'Dự phòng siêu tốc độ cao',
  },
];

let globalDictionaryTurnCounter = 0;

export async function callGeminiDictionaryAlternating(
  options: any,
  contents: any,
  config?: any
) {
  const currentTurn = globalDictionaryTurnCounter++;
  const isTurn0 = currentTurn % 2 === 0;

  // Lượt chẵn: Từ điển AI 1 -> Từ điển AI 2 -> Dự phòng
  // Lượt lẻ: Từ điển AI 2 -> Từ điển AI 1 -> Dự phòng
  const dictSequence = isTurn0
    ? [DEDICATED_DICTIONARY_MODELS[0], DEDICATED_DICTIONARY_MODELS[1], DEDICATED_DICTIONARY_MODELS[2]]
    : [DEDICATED_DICTIONARY_MODELS[1], DEDICATED_DICTIONARY_MODELS[0], DEDICATED_DICTIONARY_MODELS[2]];

  const execution = await executeWithDualKeyFailover(
    options,
    `Dictionary Lookup ${currentTurn + 1}`,
    async (ai, keyInfo, keyIndex) => {
      let lastError: any = null;

      for (const dictAI of dictSequence) {
        try {
          const res = await ai.models.generateContent({
            model: dictAI.model,
            contents,
            config,
          });
          if (res && res.text) {
            return {
              res,
              aiInfo: {
                id: dictAI.id,
                name: dictAI.name,
                model: dictAI.model,
                turn: currentTurn + 1,
                activeKeyName: keyInfo.name,
                activeKeyIndex: keyIndex,
              },
            };
          }
        } catch (err: any) {
          lastError = err;
          // Thử fallback model của riêng từ điển AI
          if (dictAI.fallbackModel && dictAI.fallbackModel !== dictAI.model) {
            try {
              const resFallback = await ai.models.generateContent({
                model: dictAI.fallbackModel,
                contents,
                config,
              });
              if (resFallback && resFallback.text) {
                return {
                  res: resFallback,
                  aiInfo: {
                    id: dictAI.id,
                    name: `${dictAI.name} (Tương thích)`,
                    model: dictAI.fallbackModel,
                    turn: currentTurn + 1,
                    activeKeyName: keyInfo.name,
                    activeKeyIndex: keyIndex,
                  },
                };
              }
            } catch (err2) {
              lastError = err2;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      throw lastError || new Error('Không thể kết nối với các mô hình Từ điển AI.');
    }
  );

  return {
    res: execution.result.res,
    aiInfo: {
      ...execution.result.aiInfo,
      totalKeys: execution.totalKeys,
      failedOver: execution.failedOver,
    },
  };
}

// =========================================================================
// NHÓM 3: CÁC TÍNH NĂNG CÒN LẠI (NON-TUTOR, NON-DICTIONARY)
// OCR trích xuất ảnh, Bóc tách Sách, Đề thi, Nhật ký, Tạo từ vựng, Nhập vai...
// Dùng nhóm mô hình độc lập: gemini-3.1-flash-lite, gemini-flash-latest, gemini-3.7-flash
// =========================================================================
export const NON_TUTOR_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

export async function callNonTutorGeminiWithRetry(options: any, contents: any, config?: any) {
  const execution = await executeWithDualKeyFailover(
    options,
    'General Feature Call',
    async (ai) => {
      let lastError: any = null;

      for (const model of NON_TUTOR_MODELS) {
        try {
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
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      throw lastError || new Error('Không thể kết nối với các mô hình AI tính năng tiện ích.');
    }
  );

  return execution.result;
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

// =========================================================================
// TRẠNG THÁI MÃ NGUỒN GEMINI & PHÂN CHIA HỆ THỐNG
// =========================================================================
export function getKeysStatus(options?: { customApiKey?: string; customApiKey2?: string; headers?: Record<string, any> }) {
  const availableKeys = getAvailableApiKeys(options);
  const envKey1 = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_1;
  const envKey2 = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_BACKUP || process.env.GEMINI_BACKUP_KEY;

  return {
    success: true,
    totalConfiguredKeys: availableKeys.length,
    dualKeyEnabled: availableKeys.length >= 2,
    keys: [
      {
        index: 1,
        name: 'Mã nguồn 1 (GEMINI_API_KEY chính)',
        configured: Boolean(envKey1),
        masked: envKey1 ? maskApiKey(envKey1) : 'Chưa cấu hình',
        source: 'env_primary',
      },
      {
        index: 2,
        name: 'Mã nguồn 2 (GEMINI_API_KEY_2 dự phòng)',
        configured: Boolean(envKey2),
        masked: envKey2 ? maskApiKey(envKey2) : 'Chưa cấu hình (Khuyên dùng trên Vercel để nhân đôi quota)',
        source: 'env_secondary',
      },
    ],
    stats: {
      ...keyStats,
    },
    systemArchitecture: {
      tutorGroup: {
        title: 'Nhóm 1: Gia sư AI (Tutor Only - Độc quyền)',
        purpose: 'Dành riêng cho Gia sư AI đối thoại & sửa bài. Thay phiên 2 AI độc quyền.',
        models: DEDICATED_TUTOR_MODELS.map((m) => ({ id: m.id, name: m.name, model: m.model })),
      },
      dictionaryGroup: {
        title: 'Nhóm 2: Tra từ điển AI (Dictionary Only - Độc quyền)',
        purpose: 'Dành riêng cho Tra cứu đại từ điển học thuật song ngữ. Luân phiên & đảm bảo >100 từ/ngày.',
        models: DEDICATED_DICTIONARY_MODELS.map((m) => ({ id: m.id, name: m.name, model: m.model })),
      },
      generalGroup: {
        title: 'Nhóm 3: Các tính năng khác (Non-Tutor, Non-Dictionary)',
        purpose: 'OCR ảnh, Bóc tách sách, Đề thi, Nhật ký, Nhập vai, Tạo ví dụ, Bổ sung song ngữ.',
        models: NON_TUTOR_MODELS,
      },
    },
  };
}

// =========================================================================
// HANDLER: 1. GIA SƯ AI ĐỐI THOẠI & PHÂN TÍCH HÌNH ẢNH (NHÓM 1)
// =========================================================================
export async function handleChat(body: any, headers?: any) {
  const { messages, language, imageBase64, imageMime, responseLength, customApiKey, customApiKey2 } = body;
  const langName = language === 'en' ? 'English (Tiếng Anh)' : language === 'ko' ? 'Korean (Tiếng Hàn)' : 'Chinese (Tiếng Trung)';

  const lengthDirective = responseLength === 'short'
    ? '⚡ QUY ĐỊNH ĐỘ DÀI: TRẢ LỜI NGẮN GỌN (Short Mode). Trả lời thật súc tích, đi thẳng vào đáp án chính hoặc bản dịch cốt lõi (dưới 3-4 câu).'
    : '📚 QUY ĐỊNH ĐỘ DÀI: TRẢ LỜI CHI TIẾT (Long Mode). Đóng vai Gia sư AI cá nhân thực thụ, giải thích tận tình, dịch đầy đủ toàn vẹn, phân tích chi tiết từng thành phần ngữ pháp, từ vựng, phiên âm, ví dụ tự nhiên và mẹo nhớ.';

  const systemInstruction = `Bạn là THỰC THỂ AI GIA SƯ NGÔN NGỮ ĐỘC LẬP VÀ THÔNG MINH NHẤT (Polyglot Hub Dedicated Flagship Language Tutor).
Bạn hoạt động như một con AI riêng biệt, thông minh nhất hệ thống, chuyên biệt nâng cao năng lực ngoại ngữ cho người học. Bạn hoàn toàn độc lập và không bị ảnh hưởng hay liên can tới các module AI bóc tách/OCR tiện ích khác.

Ngôn ngữ người học đang tập trung hiện tại: ${langName}.

${lengthDirective}

Nhiệm vụ của Gia sư AI Chuyên biệt:
1. Đóng vai Gia sư cá nhân thông minh & uyên bác: Luôn sẵn sàng dịch câu/đoạn văn chuẩn xác tự nhiên nhất, giải thích chi tiết sắc thái ngữ nghĩa, cấu trúc ngữ pháp sâu, phân biệt từ đồng nghĩa, sửa lỗi đặt câu, hướng dẫn giao tiếp thực tế và hội thoại nhập vai.
2. Khi DỊCH: Dịch thoát ý, tự nhiên như người bản xứ, giải thích chi tiết các cụm từ đắt giá.
3. Với Tiếng Anh: Cung cấp phiên âm IPA chuẩn xác cho từ/cụm từ quan trọng.
4. Với Tiếng Hàn: Cung cấp Hangul, phiên âm Romaja và phân tích kính ngữ (존댓말/반말).
5. Với Tiếng Trung: Cung cấp chữ Hán (Giản thể/Phồn thể), Pinyin có dấu thanh và bộ thủ.
6. Khi xử lý HÌNH ẢNH đính kèm (sách giáo khoa, bảng từ, bài tập): Phân tích chi tiết hình ảnh bằng nhãn quan AI cao cấp nhất, đọc chữ (OCR), dịch nghĩa và giải thích ngữ pháp bài tập sâu sát.

Nếu trong phản hồi có các từ vựng mới tiêu biểu đáng lưu vào sổ từ, hãy đính kèm ở cuối bài khối JSON:
---VOCAB_SUGGESTIONS---
[
  {
    "word": "từ",
    "meaning": "nghĩa tiếng Việt",
    "phonetic": "phiên âm",
    "type": "loại từ",
    "nghia_tieng_han": "Từ/nghĩa tiếng Hàn tương ứng kèm Romaja nếu từ là tiếng Anh (ví dụ: 포기하다 [po-gi-ha-da])",
    "nghia_tieng_anh": "Từ/nghĩa tiếng Anh tương ứng nếu từ là tiếng Hàn (ví dụ: to give up, abandon)",
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

  const { res, tutorInfo } = await callGeminiTutorAlternating(
    { customApiKey, customApiKey2, headers },
    contents,
    {
      systemInstruction,
      temperature: 0.7,
    },
    body.turn
  );

  const replyText = res.text || '';
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

  return { reply: cleanedReply || replyText, suggestedWords, tutorInfo };
}

// =========================================================================
// HANDLER: 2. TRA CỨU ĐẠI TỪ ĐIỂN HỌC THUẬT SONG NGỮ (NHÓM 2 - ĐỘC QUYỀN)
// =========================================================================
const serverDictionaryCache = new Map<string, any>();
const MAX_SERVER_CACHE_SIZE = 500;

export async function handleDictionaryLookup(body: any, headers?: any) {
  const { query, language, mode, forceRefresh, customApiKey, customApiKey2 } = body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Từ khóa tra cứu không được để trống');
  }

  const qClean = query.trim();
  const cacheKey = `${language}:${mode || 'auto'}:${qClean.toLowerCase()}`;

  // Kiểm tra bộ nhớ đệm máy chủ (0ms, 0 quota, bảo lưu tuyệt đối lượt tra)
  if (!forceRefresh && serverDictionaryCache.has(cacheKey)) {
    const cached = serverDictionaryCache.get(cacheKey);
    return {
      ...cached,
      fromCache: true,
    };
  }

  const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';
  const targetScript = language === 'en' ? 'IPA' : language === 'ko' ? 'Hangul & Romaja' : 'Chữ Hán & Pinyin';

  const prompt = `Bạn là Đại từ điển Ngôn ngữ Song ngữ và Đối chiếu học thuật chuyên sâu nhất (Anh - Hàn - Trung - Việt).
Người dùng đang tra cứu từ khóa: "${qClean}"
Ngôn ngữ mục tiêu chính: ${langName} (${language})
Chế độ tra cứu: ${mode || 'auto'} (tự động nhận diện từ khóa là tiếng Việt hay ${langName}).

Nhiệm vụ: Phân tích tra cứu mục từ một cách chuẩn xác, học thuật, toàn diện và tự nhiên nhất theo cấu trúc JSON.
Hãy cung cấp:
1. "word": Từ vựng chuẩn trong ${langName} (hoặc từ được tra). Nếu người dùng gõ tiếng Việt, hãy dịch sang từ ${langName} tương đương tự nhiên và phổ biến nhất.
2. "originalScript": Chữ Hán/Hangul gốc (nếu là Tiếng Trung thì đưa chữ Giản thể & Phồn thể; nếu là Tiếng Hàn thì đưa chữ Hangul; nếu là Tiếng Anh thì đưa từ gốc).
3. "phonetic": Phiên âm chuẩn quốc tế (${targetScript}). Tiếng Anh phải có IPA chuẩn (ví dụ: /ˈbjuːtɪfl/), Tiếng Hàn có Romaja chuẩn (ví dụ: [chug-ha-hae-yo]), Tiếng Trung có Pinyin kèm thanh điệu (ví dụ: nǐ hǎo).
4. "partOfSpeech": Loại từ tiếng Việt (Danh từ, Động từ, Tính từ, Trạng từ, Cụm từ, v.v.).
5. "level": Cấp độ (ví dụ A1, A2, B1, B2, C1, C2 cho tiếng Anh; TOPIK 1..6 cho tiếng Hàn; HSK 1..6 cho tiếng Trung).
6. "primaryMeaning": Nghĩa tiếng Việt chính xác và ngắn gọn nhất.
7. "additionalMeanings": Mảng 2-4 nghĩa phụ hoặc các nét nghĩa ngữ cảnh khác nhau bằng tiếng Việt.
8. "hanVietOrRoot": Âm Hán Việt và chữ Hán tương ứng (rất quan trọng đối với người Việt học tiếng Hàn/Trung, ví dụ 한국 [Hán Việt: Hàn Quốc], 成功 [Hán Việt: Thành công]). Nếu là tiếng Anh, có thể ghi gốc từ Latin/Hy Lạp hoặc từ tương đương Hán Việt.
9. "englishMeaning": Nghĩa tương đương trong Tiếng Anh.
10. "koreanMeaning": Nghĩa tương đương trong Tiếng Hàn.
11. "chineseMeaning": Nghĩa tương đương trong Tiếng Trung.
12. "definition": Giải thích định nghĩa ngữ cảnh và sắc thái sử dụng bằng tiếng Việt.
13. "examples": Danh sách 2-4 câu ví dụ thực tế sử dụng từ trên (mỗi câu gồm: "sentence": câu ngoại ngữ, "phonetic": phiên âm, "translation": bản dịch tiếng Việt).
14. "synonyms": Danh sách 2-5 từ đồng nghĩa trong ${langName}.
15. "antonyms": Danh sách 2-5 từ trái nghĩa trong ${langName}.
16. "collocations": 2-4 cụm từ kết hợp tự nhiên (collocations / thành ngữ) thông dụng.
17. "conjugationsOrForms": Dạng chia động từ hoặc biến thể quan trọng (ví dụ tiếng Hàn: dạng kính ngữ trang trọng, dạng thân mật, quá khứ, tương lai; tiếng Anh: V1, V2, V3, danh từ liên quan; tiếng Trung: từ ghép hay gặp). Mảng các object: {"form": "tên dạng", "description": "từ biến thể"}.
18. "grammarNotes": Ghi chú ngữ pháp hoặc lưu ý tránh dùng sai (nếu có).
19. "mnemonic": Mẹo ghi nhớ từ vựng dễ thuộc hoặc liên tưởng thú vị.

Trả về duy nhất định dạng JSON chuẩn:
{
  "found": true,
  "word": "từ",
  "originalScript": "chữ gốc",
  "phonetic": "phiên âm",
  "partOfSpeech": "loại từ",
  "level": "cấp độ",
  "primaryMeaning": "nghĩa chính",
  "additionalMeanings": ["nghĩa 1", "nghĩa 2"],
  "hanVietOrRoot": "âm Hán Việt",
  "englishMeaning": "English meaning",
  "koreanMeaning": "Korean meaning",
  "chineseMeaning": "Chinese meaning",
  "definition": "định nghĩa chi tiết",
  "examples": [
    {
      "sentence": "câu ví dụ",
      "phonetic": "phiên âm",
      "translation": "dịch nghĩa"
    }
  ],
  "synonyms": ["từ đồng nghĩa"],
  "antonyms": ["từ trái nghĩa"],
  "collocations": ["cụm từ hay đi kèm"],
  "conjugationsOrForms": [
    { "form": "tên thể", "description": "dạng từ" }
  ],
  "grammarNotes": "lưu ý ngữ pháp",
  "mnemonic": "mẹo nhớ"
}`;

  // Gọi độc quyền 2 con AI chỉ dành riêng cho Tra Từ Điển với 2 Mã Nguồn Gemini API
  const resultObj = await callGeminiDictionaryAlternating(
    { customApiKey, customApiKey2, headers },
    prompt,
    {
      responseMimeType: 'application/json',
      temperature: 0.3,
    }
  );

  const parsed = safeParseJSON(resultObj.res.text || '{}');
  const finalResult = {
    ...parsed,
    query: qClean,
    language,
    found: Boolean(parsed.word || parsed.primaryMeaning),
    aiModel: resultObj.aiInfo.name,
    aiModelId: resultObj.aiInfo.id,
    aiModelKey: resultObj.aiInfo.model,
    turn: resultObj.aiInfo.turn,
    fromCache: false,
    activeKeyIndex: resultObj.aiInfo.activeKeyIndex,
    totalKeys: resultObj.aiInfo.totalKeys,
  };

  // Lưu vào bộ đệm máy chủ
  if (finalResult.found) {
    if (serverDictionaryCache.size >= MAX_SERVER_CACHE_SIZE) {
      const firstKey = serverDictionaryCache.keys().next().value;
      if (firstKey) serverDictionaryCache.delete(firstKey);
    }
    serverDictionaryCache.set(cacheKey, finalResult);
    if (finalResult.word) {
      const wordKey = `${language}:${mode || 'auto'}:${finalResult.word.toLowerCase()}`;
      serverDictionaryCache.set(wordKey, finalResult);
    }
  }

  return finalResult;
}

// =========================================================================
// HANDLERS: NHÓM 3 (NON-TUTOR, NON-DICTIONARY - TIỆN ÍCH KHÁC)
// =========================================================================

export async function handleGenerateExample(body: any, headers?: any) {
  const { word, language, meaning, customApiKey, customApiKey2 } = body;
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
  "nghia_tieng_han": "Từ / Nghĩa tương đương trong tiếng Hàn kèm Romaja nếu từ gốc là tiếng Anh (ví dụ: 포기하다 [po-gi-ha-da])",
  "nghia_tieng_anh": "Từ / Nghĩa tương đương trong tiếng Anh nếu từ gốc là tiếng Hàn (ví dụ: birthday, to give up)",
  "level": "Cấp độ đề xuất (A1, A2, B1, B2, C1, C2 cho tiếng Anh; TOPIK 1 - TOPIK 6 cho tiếng Hàn; HSK 1 - HSK 6 cho tiếng Trung)",
  "topic": "Chủ đề phù hợp (Giao tiếp, Du lịch, Công việc, Ẩm thực, Đời sống, Cảm xúc, Học thuật...)",
  "collocations": ["Cụm từ hay đi kèm 1", "Cụm từ 2"],
  "mnemonic": "Mẹo ghi nhớ nhanh hoặc nguồn gốc chữ/từ (nếu có)",
  "synonyms": ["Từ đồng nghĩa 1", "Từ đồng nghĩa 2"]
}`;

  const response = await callNonTutorGeminiWithRetry(
    { customApiKey, customApiKey2, headers },
    prompt,
    { responseMimeType: 'application/json' }
  );

  return safeParseJSON(response.text || '{}');
}

export async function handleRoleplay(body: any, headers?: any) {
  const { scenario, language, messages, userLevel, customApiKey, customApiKey2 } = body;
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

  const response = await callNonTutorGeminiWithRetry(
    { customApiKey, customApiKey2, headers },
    contents,
    {
      systemInstruction,
      temperature: 0.7,
    }
  );

  return { reply: response.text || '' };
}

export async function handleCheckJournal(body: any, headers?: any) {
  const { text, language, promptTopic, customApiKey, customApiKey2 } = body;
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

  const response = await callNonTutorGeminiWithRetry(
    { customApiKey, customApiKey2, headers },
    prompt,
    { responseMimeType: 'application/json' }
  );

  return safeParseJSON(response.text || '{}');
}

export async function handleGenerateMockTest(body: any, headers?: any) {
  const { testType, language, level, wordList, customApiKey, customApiKey2 } = body;

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

  const response = await callNonTutorGeminiWithRetry(
    { customApiKey, customApiKey2, headers },
    prompt,
    { responseMimeType: 'application/json' }
  );

  return safeParseJSON(response.text || '{}');
}

export async function handleOcrExtract(body: any, headers?: any) {
  const { imageBase64, images, language, customApiKey, customApiKey2 } = body;
  const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';

  const prompt = `Bạn là hệ thống OCR Chuyên sâu & Trích xuất Từ vựng Ngôn ngữ (${langName}) với độ chính xác tuyệt đối.

YÊU CẦU QUAN TRỌNG HÀNG ĐẦU - ĐỌC VÀ TRÍCH XUẤT 100% TOÀN BỘ DỮ LIỆU:
1. TRÍCH XUẤT ĐẦY ĐỦ 100% CÁC TỪ VỰNG: Đọc lần lượt từng dòng, từng cột từ trên xuống dưới. BẮT BUỘC trích xuất TẤT CẢ các từ vựng vào mảng "words".
2. QUY TẮC ĐỐI ỨNG ANH - HÀN BẮT BUỘC:
   - Nếu từ vựng là Tiếng Hàn (ko):
     • "tu": Từ tiếng Hàn (Hangul).
     • "phien_am": Phiên âm Romaja chuẩn (ví dụ: [po-gi-ha-da]).
     • "nghia": Nghĩa Tiếng Việt chuẩn xác.
     • "nghia_tieng_anh": BẮT BUỘC CÓ từ/nghĩa Tiếng Anh tương ứng chính xác (ví dụ: "to give up, abandon").
     • "nghia_tieng_han": "".
   - Nếu từ vựng là Tiếng Anh (en):
     • "tu": Từ tiếng Anh.
     • "phien_am": Phiên âm IPA chuẩn quốc tế (ví dụ: /ˈbjuːtɪfl/).
     • "nghia": Nghĩa Tiếng Việt chuẩn xác.
     • "nghia_tieng_han": BẮT BUỘC CÓ từ/nghĩa Tiếng Hàn tương ứng kèm Romaja (ví dụ: "아름다운 [a-reum-da-un]").
     • "nghia_tieng_anh": "".

Cấu trúc JSON đầu ra:
{
  "language": "${language}",
  "title": "Tên chủ đề trích xuất",
  "words": [
    {
      "tu": "từ",
      "phien_am": "phiên âm",
      "nghia": "nghĩa tiếng Việt",
      "nghia_tieng_han": "nghĩa tiếng Hàn kèm Romaja (nếu từ là tiếng Anh)",
      "nghia_tieng_anh": "nghĩa tiếng Anh (nếu từ là tiếng Hàn)",
      "loai_tu": "Danh từ / Động từ / Tính từ",
      "cap_do": "Cấp độ đề xuất",
      "chu_de": "Chủ đề",
      "vi_du": "Câu ví dụ ngoại ngữ",
      "vi_du_dich": "Dịch ví dụ tiếng Việt"
    }
  ]
}`;

  let parts: any[] = [];
  if (Array.isArray(images) && images.length > 0) {
    images.forEach((img) => {
      parts.push({
        inlineData: {
          data: img.data ? img.data.replace(/^data:image\/[a-z0-9\+\.-]+;base64,/, '') : img.replace(/^data:image\/[a-z0-9\+\.-]+;base64,/, ''),
          mimeType: img.mimeType || 'image/jpeg',
        },
      });
    });
  } else if (imageBase64) {
    parts.push({
      inlineData: {
        data: imageBase64.replace(/^data:image\/[a-z0-9\+\.-]+;base64,/, ''),
        mimeType: 'image/jpeg',
      },
    });
  }
  parts.push({ text: prompt });

  const response = await callNonTutorGeminiWithRetry(
    { customApiKey, customApiKey2, headers },
    parts,
    { responseMimeType: 'application/json' }
  );

  const parsed = safeParseJSON(response.text || '{}');
  if (Array.isArray(parsed.words)) {
    parsed.words = await ensureBilingualCrossMeanings(parsed.words, language, { customApiKey, customApiKey2, headers });
  }

  return parsed;
}

export async function handleExtractTextbook(body: any, headers?: any) {
  const { text, imageBase64, language, customApiKey, customApiKey2 } = body;
  const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';

  const prompt = `Bạn là hệ thống AI Chuyên gia phân tích tài liệu giáo trình ${langName}.
Hãy trích xuất TOÀN BỘ từ vựng và ngữ pháp có trong tài liệu dưới đây thành định dạng JSON:

${text ? `Nội dung tài liệu:\n"""\n${text}\n"""` : ''}

Quy định cấu trúc JSON:
{
  "vocabulary": [
    {
      "tu": "từ",
      "phien_am": "phiên âm chuẩn",
      "nghia": "nghĩa tiếng Việt",
      "nghia_tieng_han": "nghĩa tiếng Hàn kèm Romaja (nếu từ là tiếng Anh)",
      "nghia_tieng_anh": "nghĩa tiếng Anh (nếu từ là tiếng Hàn)",
      "loai_tu": "loại từ",
      "cap_do": "cấp độ",
      "chu_de": "chủ đề bài học",
      "vi_du": "câu ví dụ",
      "vi_du_dich": "dịch ví dụ"
    }
  ],
  "grammar": [
    {
      "cau_truc": "cấu trúc ngữ pháp",
      "y_nghia": "ý nghĩa ngữ pháp bằng tiếng Việt",
      "giai_thich": "giải thích cách kết hợp chi tiết",
      "cap_do": "cấp độ",
      "vi_du": "câu ví dụ chuẩn",
      "vi_du_dich": "dịch ví dụ",
      "tags": ["Bài học", "Chủ đề"]
    }
  ]
}`;

  let parts: any[] = [];
  if (imageBase64) {
    parts.push({
      inlineData: {
        data: imageBase64.replace(/^data:image\/[a-z0-9\+\.-]+;base64,/, ''),
        mimeType: 'image/jpeg',
      },
    });
  }
  parts.push({ text: prompt });

  const response = await callNonTutorGeminiWithRetry(
    { customApiKey, customApiKey2, headers },
    parts,
    { responseMimeType: 'application/json' }
  );

  const parsed = safeParseJSON(response.text || '{}');
  if (Array.isArray(parsed.vocabulary)) {
    parsed.vocabulary = await ensureBilingualCrossMeanings(parsed.vocabulary, language, { customApiKey, customApiKey2, headers });
  }

  return parsed;
}

export async function handleFillMissingBilingual(body: any, headers?: any) {
  const { words, language, customApiKey, customApiKey2 } = body;
  if (!Array.isArray(words) || words.length === 0) {
    return { results: [] };
  }

  const langName = language === 'en' ? 'Tiếng Anh' : language === 'ko' ? 'Tiếng Hàn' : 'Tiếng Trung';

  const prompt = `Bạn là chuyên gia ngôn ngữ học đối chiếu Anh - Hàn - Việt.
Nhiệm vụ: Cung cấp nghĩa đối ứng chính xác tuyệt đối cho danh sách từ vựng ${langName} sau:
- Với từ Tiếng Hàn (ko): BẮT BUỘC cung cấp từ/nghĩa tương đương trong Tiếng Anh ("nghia_tieng_anh") (ví dụ: 포기하다 -> to give up / abandon).
- Với từ Tiếng Anh (en): BẮT BUỘC cung cấp từ/nghĩa tương đương trong Tiếng Hàn kèm Romaja ("nghia_tieng_han") (ví dụ: abandon -> 포기하다, 버리다 [po-gi-ha-da]).

Danh sách từ cần bổ sung:
${JSON.stringify(
  words.map((w: any) => ({
    word_id: w.word_id,
    tu: w.tu,
    nghia: w.nghia,
    ngon_ngu: w.ngon_ngu || language,
  })),
  null,
  2
)}

Trả về kết quả chuẩn JSON duy nhất với cấu trúc:
{
  "results": [
    {
      "word_id": "word_id từ danh sách",
      "nghia_tieng_han": "Từ/nghĩa tiếng Hàn tương ứng kèm Romaja (nếu từ là tiếng Anh, ví dụ: 생일 [saeng-il])",
      "nghia_tieng_anh": "Từ/nghĩa tiếng Anh tương ứng chuẩn xác (nếu từ là tiếng Hàn, ví dụ: birthday)",
      "phien_am": "Phiên âm chuẩn bổ sung nếu thiếu (IPA cho Anh, Romaja cho Hàn)"
    }
  ]
}`;

  const response = await callNonTutorGeminiWithRetry(
    { customApiKey, customApiKey2, headers },
    prompt,
    {
      responseMimeType: 'application/json',
      temperature: 0.1,
    }
  );

  return safeParseJSON(response.text || '{"results":[]}');
}

export async function ensureBilingualCrossMeanings(words: any[], defaultLanguage: string, options?: any) {
  if (!Array.isArray(words) || words.length === 0) return words;

  const isHangul = (text: string) => /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text || '');
  const isChinese = (text: string) => /[\u4E00-\u9FFF]/.test(text || '');

  const missingList: any[] = [];

  words.forEach((w, index) => {
    if (isHangul(w.tu)) {
      w.ngon_ngu = 'ko';
    } else if (isChinese(w.tu)) {
      w.ngon_ngu = 'zh';
    } else if (defaultLanguage === 'en' || !isHangul(w.tu)) {
      w.ngon_ngu = defaultLanguage || 'en';
    } else {
      w.ngon_ngu = defaultLanguage || 'ko';
    }

    if (w.ngon_ngu === 'ko') {
      if (!w.nghia_tieng_anh || String(w.nghia_tieng_anh).trim() === '') {
        missingList.push({ index, tu: w.tu, nghia: w.nghia, ngon_ngu: 'ko' });
      }
    }

    if (w.ngon_ngu === 'en') {
      if (!w.nghia_tieng_han || String(w.nghia_tieng_han).trim() === '') {
        missingList.push({ index, tu: w.tu, nghia: w.nghia, ngon_ngu: 'en' });
      }
    }
  });

  if (missingList.length > 0) {
    try {
      const fillResult = await handleFillMissingBilingual({
        language: defaultLanguage || 'ko',
        words: missingList.map((m) => ({
          word_id: String(m.index),
          tu: m.tu,
          nghia: m.nghia,
          ngon_ngu: m.ngon_ngu,
        })),
        ...(options || {}),
      }, options?.headers);

      if (Array.isArray(fillResult.results)) {
        fillResult.results.forEach((r: any) => {
          const idx = parseInt(r.word_id, 10);
          if (!isNaN(idx) && words[idx]) {
            if (r.nghia_tieng_anh && (!words[idx].nghia_tieng_anh || words[idx].nghia_tieng_anh.trim() === '')) {
              words[idx].nghia_tieng_anh = r.nghia_tieng_anh;
            }
            if (r.nghia_tieng_han && (!words[idx].nghia_tieng_han || words[idx].nghia_tieng_han.trim() === '')) {
              words[idx].nghia_tieng_han = r.nghia_tieng_han;
            }
            if (r.phien_am && (!words[idx].phien_am || words[idx].phien_am.trim() === '')) {
              words[idx].phien_am = r.phien_am;
            }
          }
        });
      }
    } catch (err) {
      console.warn('Tự động bổ sung nghĩa đối ứng AI thất bại:', err);
    }
  }

  return words;
}
