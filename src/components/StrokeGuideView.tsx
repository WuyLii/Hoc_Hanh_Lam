import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../types';
import { ttsService } from '../services/ttsService';
import { PenTool, Volume2, Layers } from 'lucide-react';

const CHINESE_BASIC_STROKES = [
  { name: 'Nét Ngang (Héng - 横)', symbol: '一', desc: 'Viết từ trái sang phải, hơi vát nhẹ ở đuôi nét' },
  { name: 'Nét Sổ (Shù - 竖)', symbol: '丨', desc: 'Viết từ trên xuống dưới thẳng đứng vững chãi' },
  { name: 'Nét Phẩy (Piě - 撇)', symbol: '丿', desc: 'Viết từ trên lượn cong sang góc dưới bên trái' },
  { name: 'Nét Mác (Nà - 捺)', symbol: '乀', desc: 'Viết từ trên sang góc dưới bên phải với nét chân đậm' },
  { name: 'Nét Chấm (Diǎn - 点)', symbol: '丶', desc: 'Nhấn nhẹ như hình giọt nước từ trên xuống' },
  { name: 'Nét Hất (Tí - 提)', symbol: '𠀁', desc: 'Từ dưới bên trái hất nhanh chéo lên trên bên phải' },
  { name: 'Nét Gập (Béng - 𠃍)', symbol: '乛', desc: 'Nét ngang chuyển hướng gập vuông góc xuống dưới' },
  { name: 'Nét Móc (Gōu - 亅)', symbol: '亅', desc: 'Nét sổ đi xuống rồi móc nhọn chếch lên trên' },
];

const CHINESE_SAMPLE_CHARACTERS = [
  { char: '永', pinyin: 'yǒng', meaning: 'Vĩnh cửu (Chứa trọn vẹn 8 nét chữ cơ bản)', strokes: 5, strokeOrder: 'Chấm → Gập móc → Hất → Phẩy → Mác' },
  { char: '学', pinyin: 'xué', meaning: 'Học tập / Nghiên cứu', strokes: 8, strokeOrder: 'Chấm → Chấm → Phẩy → Chấm gập → Móc → Gập → Cong móc → Ngang' },
  { char: '爱', pinyin: 'ài', meaning: 'Tình yêu / Yêu thương', strokes: 10, strokeOrder: 'Phẩy → Chấm → Chấm → Phẩy → Chấm gập → Ngang phẩy → Mác' },
  { char: '中', pinyin: 'zhōng', meaning: 'Trung tâm / Ở giữa', strokes: 4, strokeOrder: 'Sổ → Gập → Ngang → Sổ dọc chính giữa' },
  { char: '国', pinyin: 'guó', meaning: 'Quốc gia / Đất nước', strokes: 8, strokeOrder: 'Sổ ngoài → Gập ngoài → Ngang trong → Sổ trong → Ngang trong → Chấm trong → Ngang đóng đáy' },
];

const KOREAN_HANGUL_RADICALS = [
  { char: 'ㄱ', name: 'Giyeok (기역)', sound: 'g / k', desc: 'Hình dáng gốc lưỡi nâng lên chạm vào vòm họng mềm' },
  { char: 'ㄴ', name: 'Nieun (니은)', sound: 'n', desc: 'Hình dáng đầu lưỡi chạm vào nướu răng trên' },
  { char: 'ㄷ', name: 'Digeut (디귿)', sound: 'd / t', desc: 'Nét thêm vào từ chữ ㄴ thể hiện âm mạnh hơn' },
  { char: 'ㄹ', name: 'Rieul (리을)', sound: 'r / l', desc: 'Chuyển động uốn cong mềm mại của đầu lưỡi' },
  { char: 'ㅁ', name: 'Mieum (미음)', sound: 'm', desc: 'Hình dáng môi khép lại khi phát âm' },
  { char: 'ㅂ', name: 'Bieup (비읍)', sound: 'b / p', desc: 'Nét bật mạnh mở rộng từ khẩu hình chữ ㅁ' },
  { char: 'ㅅ', name: 'Siot (시옷)', sound: 's', desc: 'Hình dáng của răng cửa sắc nhọn' },
  { char: 'ㅇ', name: 'Ieung (이응)', sound: 'ng / âm câm', desc: 'Hình tròn của thanh quản khi mở rộng' },
  { char: 'ㅏ', name: 'A (아)', sound: 'a', desc: 'Nguyên âm Dương: Mặt trời mọc ở hướng Đông' },
  { char: 'ㅓ', name: 'Eo (어)', sound: 'eo', desc: 'Nguyên âm Âm: Mặt trời lặn ở hướng Tây' },
  { char: 'ㅗ', name: 'O (오)', sound: 'o', desc: 'Nguyên âm Dương: Mặt trời nhô lên trên mặt đất' },
  { char: 'ㅜ', name: 'U (우)', sound: 'u', desc: 'Nguyên âm Âm: Mặt trời chìm xuống dưới mặt đất' },
];

export const StrokeGuideView: React.FC = () => {
  const [selectedChar, setSelectedChar] = useState<any>(CHINESE_SAMPLE_CHARACTERS[0]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5">
              Cẩm nang thư pháp & Nét chữ
            </span>
            <span className="text-xs font-serif italic text-stone-600">
              Quy tắc viết nét Hán tự & Cấu trúc chữ cái Hangul
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Hướng dẫn thứ tự nét chữ (Vĩnh Tự Bát Pháp)
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-2 max-w-2xl">
            Quy tắc cốt lõi: "Trên trước dưới sau, trái trước phải sau, ngoài trước trong sau, vào trước đóng sau".
          </p>
        </div>
      </div>

      {/* 8 Basic Chinese Strokes */}
      <div className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A] border-b border-[#1A1A1A] pb-3 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>Vĩnh Tự Bát Pháp (永字八法) — 8 Nét cơ bản của chữ Hán</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CHINESE_BASIC_STROKES.map((stroke, idx) => (
            <div
              key={idx}
              className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif font-black text-[#1A1A1A]">{stroke.symbol}</span>
                <span className="text-[9px] font-mono text-stone-500">Nét {idx + 1}</span>
              </div>
              <h3 className="text-xs font-serif font-bold text-[#1A1A1A]">{stroke.name}</h3>
              <p className="text-[11px] font-serif text-stone-600 leading-snug">{stroke.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Character Breakdown Simulator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Selector */}
        <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow-sm space-y-3">
          <h3 className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-600 border-b border-[#1A1A1A] pb-2">
            Chọn chữ Hán phân tích mẫu:
          </h3>
          <div className="space-y-2">
            {CHINESE_SAMPLE_CHARACTERS.map((c) => (
              <button
                key={c.char}
                onClick={() => setSelectedChar(c)}
                className={`w-full p-3 border text-left transition flex items-center justify-between ${
                  selectedChar.char === c.char
                    ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A] font-bold'
                    : 'bg-[#F9F7F2] border-stone-300 text-[#1A1A1A] hover:border-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-serif">{c.char}</span>
                  <div>
                    <span className="text-xs font-mono">{c.pinyin}</span>
                    <p className="text-[10px] opacity-75">{c.meaning.slice(0, 18)}...</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono">{c.strokes} nét</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Character Analysis Card */}
        <div className="md:col-span-2 p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b border-[#1A1A1A]/15 pb-4">
              <div className="flex items-baseline gap-6">
                <span className="text-7xl sm:text-8xl font-serif font-black text-[#1A1A1A] leading-none">
                  {selectedChar.char}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-mono tracking-widest text-[#1A1A1A]">{selectedChar.pinyin}</span>
                    <button
                      onClick={() => ttsService.speak(selectedChar.char, 'zh')}
                      className="p-1.5 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-base font-serif italic text-stone-700 mt-1">{selectedChar.meaning}</p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold bg-[#F9F7F2] border border-[#1A1A1A] px-2 py-1">
                {selectedChar.strokes} NÉT
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#1A1A1A]">
                Thứ tự viết nét chuẩn:
              </span>
              <div className="p-4 bg-[#F9F7F2] border-l-4 border-[#1A1A1A] text-sm font-serif text-[#1A1A1A] leading-relaxed">
                {selectedChar.strokeOrder}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hangul Radicals Section */}
      <div className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A] border-b border-[#1A1A1A] pb-3">
          Cấu trúc chữ cái Hangul & Hình học phát âm (Hunminjeongeum - Huấn Dân Chính Âm)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {KOREAN_HANGUL_RADICALS.map((h, idx) => (
            <div key={idx} className="p-4 bg-[#F9F7F2] border border-[#1A1A1A] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-serif font-black text-[#1A1A1A]">{h.char}</span>
                <span className="text-[10px] font-mono text-stone-500">{h.sound}</span>
              </div>
              <h4 className="text-xs font-serif font-bold text-[#1A1A1A]">{h.name}</h4>
              <p className="text-[10px] font-serif text-stone-600 leading-tight">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
