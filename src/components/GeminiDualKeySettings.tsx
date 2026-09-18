import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Zap,
  Server,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Bot,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const GeminiDualKeySettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/keys-status');
      if (!res.ok) throw new Error('Không thể lấy thông tin trạng thái khóa');
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi kiểm tra trạng thái khóa API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 bg-[#FAF9F5] border-2 border-[#1A1A1A] editorial-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-500 text-stone-950 text-[10px] font-mono font-bold uppercase px-2 py-0.5">
                Dual Gemini API Engine
              </span>
              <span className="text-xs font-mono text-stone-600">
                Phân tải &amp; Dự phòng Tự động cho Vercel / Cloud
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#1A1A1A]">
              Hệ Thống 2 Mã Nguồn Gemini API &amp; Phân Chia AI Chuyên Biệt
            </h2>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-[#F9F7F2] font-mono text-xs font-bold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 transition self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Đang Kiểm Tra...' : 'Kiểm Tra Trạng Thái'}</span>
          </button>
        </div>

        <p className="text-xs font-serif text-stone-700 leading-relaxed">
          Trang web được thiết kế với cơ chế <strong>Phân Tải Độc Quyền (Load Balancing)</strong> và <strong>Tự Động Chuyển Đổi Dự Phòng (Auto-Failover)</strong> giữa 2 mã nguồn API Gemini độc lập khi triển khai trên Vercel. Khi mã nguồn 1 chạm giới hạn lượt gọi (429 Rate Limit) hoặc gặp sự cố, hệ thống sẽ tự động chuyển sang mã nguồn 2 trong mili-giây mà không làm gián đoạn việc học.
        </p>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2 Key Status Display Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key 1 Card */}
        <div className="p-5 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-emerald-100 border border-emerald-400 flex items-center justify-center text-emerald-800">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-black text-[#1A1A1A]">Mã Nguồn 1 (Chính)</h3>
                <span className="text-[10px] font-mono text-stone-600">GEMINI_API_KEY</span>
              </div>
            </div>
            {status?.keys?.[0]?.configured ? (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> ĐÃ KẾT NỐI
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                <AlertCircle className="w-3 h-3" /> CHƯA CẤU HÌNH
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600">Trạng thái:</span>
              <span className="font-bold text-[#1A1A1A]">{status?.keys?.[0]?.configured ? 'Hoạt động bình thường' : 'Đang chờ cấu hình'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600">Mã che dấu:</span>
              <span className="font-bold text-stone-800">{status?.keys?.[0]?.masked || 'Chưa nhận diện'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-600">Lượt gọi thành công:</span>
              <span className="font-bold text-emerald-700">{status?.stats?.key1Calls ?? 0} lượt</span>
            </div>
          </div>
        </div>

        {/* Key 2 Card */}
        <div className="p-5 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-sky-100 border border-sky-400 flex items-center justify-center text-sky-800">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-black text-[#1A1A1A]">Mã Nguồn 2 (Dự phòng / Phân tải)</h3>
                <span className="text-[10px] font-mono text-stone-600">GEMINI_API_KEY_2</span>
              </div>
            </div>
            {status?.keys?.[1]?.configured ? (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-sky-700 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> ĐÃ KẾT NỐI
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-stone-600 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded">
                TÙY CHỌN BỔ SUNG
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600">Trạng thái:</span>
              <span className="font-bold text-[#1A1A1A]">
                {status?.keys?.[1]?.configured ? 'Sẵn sàng phân tải song song' : 'Chưa cấu hình (Khuyên dùng)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600">Mã che dấu:</span>
              <span className="font-bold text-stone-800">{status?.keys?.[1]?.masked || 'Chưa cấu hình'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-600">Lượt gọi thành công:</span>
              <span className="font-bold text-sky-700">{status?.stats?.key2Calls ?? 0} lượt</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Tier AI System Partitioning Architecture */}
      <div className="p-6 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-5">
        <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-serif font-black text-[#1A1A1A]">
            Kiến Trúc Phân Chia 3 Nhóm AI Chuyên Biệt (AI Partitioning)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-serif">
          {/* Group 1: Tutor */}
          <div className="p-4 bg-emerald-50/60 border-2 border-emerald-800/60 rounded-none space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-700" />
              <h4 className="font-serif font-black text-xs text-emerald-950 uppercase tracking-wide">
                Nhóm 1: Gia Sư AI (Độc Quyền)
              </h4>
            </div>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              Dành riêng cho Gia sư AI đối thoại &amp; sửa bài. Hoạt động độc quyền luân phiên qua từng câu hỏi:
            </p>
            <ul className="text-[11px] space-y-1.5 font-mono text-emerald-900 bg-white/80 p-2.5 border border-emerald-200">
              <li>• <strong>AI 1:</strong> Gemini 3.7 Flash</li>
              <li>• <strong>AI 2:</strong> Gemini 3.1 Pro</li>
              <li>• <strong>Dự phòng:</strong> Flash Lite</li>
            </ul>
            <div className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-1">
              ✓ Tuyệt đối không chia sẻ với tính năng khác
            </div>
          </div>

          {/* Group 2: Dictionary */}
          <div className="p-4 bg-amber-50/60 border-2 border-amber-800/60 rounded-none space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <h4 className="font-serif font-black text-xs text-amber-950 uppercase tracking-wide">
                Nhóm 2: Tra Từ Điển AI (Độc Quyền)
              </h4>
            </div>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              Dành riêng cho Đại từ điển học thuật song ngữ (Anh - Hàn - Trung - Việt). Luân phiên bảo đảm &gt;100 từ/ngày:
            </p>
            <ul className="text-[11px] space-y-1.5 font-mono text-amber-900 bg-white/80 p-2.5 border border-amber-200">
              <li>• <strong>AI 1:</strong> Gemini 3.8 Flash</li>
              <li>• <strong>AI 2:</strong> Gemini Flash Latest</li>
              <li>• <strong>Bộ đệm:</strong> Lưu 0ms &amp; 0 quota</li>
            </ul>
            <div className="text-[10px] font-mono text-amber-800 bg-amber-100/70 px-2 py-1">
              ✓ Độc quyền phân tích học thuật chuyên sâu
            </div>
          </div>

          {/* Group 3: General Tools */}
          <div className="p-4 bg-purple-50/60 border-2 border-purple-800/60 rounded-none space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <h4 className="font-serif font-black text-xs text-purple-950 uppercase tracking-wide">
                Nhóm 3: Các Tính Năng Tiện Ích
              </h4>
            </div>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              Trang bị nhóm mô hình riêng biệt cho các tác vụ tiện ích hỗ trợ người học:
            </p>
            <ul className="text-[11px] space-y-1.5 font-mono text-purple-900 bg-white/80 p-2.5 border border-purple-200">
              <li>• OCR ảnh &amp; Bóc tách sách</li>
              <li>• Tạo Đề thi TOEIC/TOPIK/HSK</li>
              <li>• Chấm nhật ký &amp; Nhập vai tình huống</li>
            </ul>
            <div className="text-[10px] font-mono text-purple-800 bg-purple-100/70 px-2 py-1">
              ✓ Tự động thử lại khi quá tải
            </div>
          </div>
        </div>
      </div>

      {/* Vercel Deployment Instructions */}
      <div className="p-6 bg-[#1A1A1A] text-[#F9F7F2] border-2 border-[#1A1A1A] editorial-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-stone-700 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-serif font-black text-[#F9F7F2]">
              Hướng Dẫn Cấu Hình 2 Khóa API Khi Triển Khai Trên Vercel
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-amber-400 text-stone-950 font-bold px-2 py-0.5 uppercase">
            Vercel Deployment Guide
          </span>
        </div>

        <div className="space-y-3 text-xs font-mono text-stone-300">
          <p className="font-serif text-sm text-stone-200">
            Để trang web sử dụng đồng thời cả 2 mã nguồn Gemini API trên Vercel, bạn chỉ cần thêm 2 biến môi trường sau vào dự án Vercel:
          </p>

          <div className="bg-black/60 p-4 border border-stone-700 space-y-3 rounded">
            <div>
              <div className="text-amber-400 font-bold mb-1">1. Biến môi trường chính (Key 1):</div>
              <code className="text-emerald-400 select-all block bg-stone-900 p-2 rounded">
                GEMINI_API_KEY = AIzaSy... (Mã API Gemini số 1)
              </code>
            </div>

            <div>
              <div className="text-amber-400 font-bold mb-1">2. Biến môi trường phụ (Key 2 - Tùy chọn để nhân đôi quota):</div>
              <code className="text-sky-400 select-all block bg-stone-900 p-2 rounded">
                GEMINI_API_KEY_2 = AIzaSy... (Mã API Gemini số 2 từ tài khoản/dự án khác)
              </code>
            </div>
          </div>

          <div className="pt-2 text-stone-400 font-serif text-xs leading-relaxed">
            <strong>Các bước thực hiện trên Vercel:</strong>
            <ol className="list-decimal list-inside space-y-1 mt-1 font-mono text-[11px] text-stone-300">
              <li>Truy cập vào Vercel Dashboard → Chọn dự án của bạn.</li>
              <li>Vào tab <strong>Settings</strong> → Chọn mục <strong>Environment Variables</strong>.</li>
              <li>Thêm biến <code>GEMINI_API_KEY</code> với giá trị là API Key thứ nhất.</li>
              <li>Thêm biến <code>GEMINI_API_KEY_2</code> với giá trị là API Key thứ hai.</li>
              <li>Nhấn <strong>Redeploy</strong> dự án để các biến có hiệu lực ngay lập tức.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
