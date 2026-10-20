---
name: hoc-hanh-tutor-agent
description: Hệ thống Gia sư AI Đa nhiệm (Tutor Agent) hỗ trợ điều hướng, lối tắt trò chơi, quản lý từ vựng và bảo vệ an toàn dữ liệu trên nền Polyglot Hub.
---

# KỸ NĂNG: HỌC HÀNH TUTOR AGENT (POLYGLOT HUB TUTOR AGENT)

Tài liệu chuẩn mực hướng dẫn kiến trúc, hợp đồng action, ranh giới vùng đóng băng, quy trình thêm action mới và cách chạy đánh giá định lượng cho hệ thống Gia sư AI Đa nhiệm.

---

## 1. TỔNG QUAN KIẾN TRÚC 3 LUỒNG ĐỘC LẬP

Hệ thống Polyglot Hub vận hành 3 luồng Gemini AI hoàn toàn độc lập về model và hạn mức (quota):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             POLYGLOT HUB WEB                                │
└──────┬──────────────────────────────┬───────────────────────────────┬───────┘
       │                              │                               │
       ▼                              ▼                               ▼
 [LUỒNG 1: TỪ ĐIỂN]         [LUỒNG 2: TIỆN ÍCH AI]          [LUỒNG 3: GIA SƯ AI]
 ──────────────────         ──────────────────────          ────────────────────
 • Gemini 3.1 Flash Lite    • Gemini 3.8 Flash              • Gemini 3.8 Flash
 • Cache máy chủ 500 mục    • OCR Trích xuất ảnh            • Flash Latest
 • /api/gemini/dictionary   • Bóc tách sách giáo khoa       • Dual-key luân phiên
 • VÙNG ĐÓNG BĂNG 100%      • Đề thi & Nhật ký              • Route: /api/tutor/agent
                            • VÙNG ĐÓNG BĂNG 100%           • Fallback: /api/gemini/chat
```

---

## 2. PHÂN HẠNG ACTION (ACTION TIERS)

Mọi hành động từ Tutor Agent bắt buộc phải thuộc một trong 3 Tier an toàn được định nghĩa tại `src/agent/actionRegistry.ts`:

### **Tier 0 (T0) — Điều hướng & Đọc an toàn (One-touch Quick Action)**
- **Đặc điểm**: Không làm thay đổi hay ghi dữ liệu người dùng.
- **Hành vi**: Hiển thị nút bấm lối tắt (Action Chip), người dùng nhấn 1 chạm là thực thi ngay lập tức.
- **Danh sách action**:
  - `navigate`: Chuyển màn hình (`dashboard`, `levels`, `dictionary`, `vocabulary`, `grammar`, `games`, `mocktest`, `stroke`, `numbers`, `sheets`).
    * *Cấm tuyệt đối*: Trỏ tới `listening` (màn hình không tồn tại).
  - `open_game`: Mở 1 trong 8 trò chơi (`flashcard`, `multiple_choice`, `matching`, `fill_blank`, `scramble`, `picture_guess`, `hangman`, `typing`) kèm bộ thẻ `deckId` nếu có.
  - `open_vocabulary`: Mở Sổ từ vựng kèm lọc cấp độ/tìm kiếm.
  - `open_grammar`: Mở Sổ ngữ pháp kèm lọc cấp độ.
  - `open_dictionary`: Mở giao diện Từ điển (chỉ điều hướng, không kích hoạt tra từ tự động để bảo toàn luồng từ điển độc lập).
  - `open_numbers`: Mở Bảng số đếm đa ngữ.
  - `open_stroke`: Mở Bảng tập viết nét chữ Hán / bảng chữ cái.
  - `open_mocktest`: Mở phòng luyện đề thi thử Topik/TOEIC/HSK.
  - `open_levels`: Xem Thang cấp độ năng lực ngôn ngữ.
  - `open_settings_hub`: Mở Cài đặt cơ sở dữ liệu & sao lưu.
  - `set_language`: Đổi ngôn ngữ học hiện tại (`ko` | `en` | `zh`).
  - `show_study_summary`: Xem tiến độ SRS hôm nay và số từ đến hạn ôn.

### **Tier 1 (T1) — Ghi dữ liệu có thể hoàn tác (Explicit Confirmation Required)**
- **Đặc điểm**: Thêm hoặc cập nhật dữ liệu nhưng không gây nguy cơ mất mát.
- **Hành vi**: BẮT BUỘC hiển thị Khối Thẻ Xác Nhận (Confirmation Card) kèm đầy đủ thông tin (Từ vựng, Nghĩa, Phiên âm, Ví dụ). Model KHÔNG THỂ tự ý ghi đè hay bỏ qua xác nhận. Chỉ khi người dùng bấm *"Xác nhận ghi vào máy"*, action mới được kích hoạt.
- **Danh sách action**:
  - `add_vocabulary`: Lưu từ vựng mới vào sổ từ.
  - `toggle_today_flashcard`: Ghim từ vựng vào danh sách ôn tập hôm nay.
  - `set_level`: Cập nhật cấp độ mục tiêu người học (TOPIK, HSK, CEFR).

### **Tier 2 (T2) — Phá hủy dữ liệu / Đồng bộ toàn phần (CẤM TỰ ĐỘNG THỰC THI)**
- **Đặc điểm**: Các thao tác nguy hiểm như `clearAllData`, xóa hàng loạt từ vựng, reset điểm/SRS, ghi đè Google Sheets/Supabase.
- **Hành vi**: Chatbot TUYỆT ĐỐI KHÔNG BAO GIỜ có quyền thực thi. Chatbot giải thích lý do an toàn và sinh thẻ hướng dẫn người dùng tự thao tác tại Trung tâm Cài đặt (`danger_zone_guidance`).

---

## 3. RANH GIỚI VÙNG ĐÓNG BĂNG (FROZEN ZONE INTEGRITY)

29 tệp sau đây thuộc vùng đóng băng bất khả xâm phạm. Bất kỳ sự thay đổi dù chỉ 1 byte sẽ làm sai lệch mã băm sha256 và vi phạm hợp đồng hệ thống:

```json
{
  "src/services/dictionaryService.ts": "b8457e53b6d7bdff560fdcb15e5db7ee079888c1686bc0bce88e4979c318367c",
  "src/components/DictionaryView.tsx": "0459b8a3275bad450166668bbc1d5394d6a7bf01ba54052bc6e6c3cf7178dc03",
  "src/components/OcrScannerModal.tsx": "bfd9f25f1fb6733b68bf373af0e355631d841903a5d5585e6cb1fe3e38fd5249",
  "src/components/TextbookExtractorModal.tsx": "a16fa435c1549ec8fda44f122f2dfe91d51be69f9b05b26682c3a572767a1a8c",
  "src/components/VocabularyManager.tsx": "b293e163aeea09511b1aa63e44295cbb889285cc24d4536c6f0988146ce2282e",
  "src/components/MockTestView.tsx": "1e566031e31a4bd4ad7becfa332aba224eeabc05c798a208448d54498e214e6f",
  "src/components/Navbar.tsx": "f25848792352315400f543327100775ef98fde39f683cdc58119706f055b8932",
  "src/components/Dashboard.tsx": "3215df2c37970824007ce302d737596e489b359bc987f0b2062f67bdbe450ed3",
  "src/components/ProficiencyLevelView.tsx": "ea430f995e0e39f32026cd36fc05c8e394ea1bbdb9205eb5bbfa2803532efda2",
  "src/components/games/GameReviewHub.tsx": "002bc6a55ce572d325c65640e07e984c84cb2286133b06c66846f1a679629849",
  "src/components/games/FlashcardGame.tsx": "1fa6b46881f7bcf0471f08cf823b21d747af55aec6645788c9211c8222b8df7a",
  "src/components/games/MultipleChoiceGame.tsx": "79dfdf28062fbf29b45ee461cca5a6a446961d338896a1bb0d8de9f2afa4d71d",
  "src/components/games/MatchingPairsGame.tsx": "4a7a616755c923a47a39b81a1493b428d5a8c5f0e57482d26f78066729dd1c82",
  "src/components/games/FillInBlankGame.tsx": "0fae2e29ef4066dea17d331018439fec00e0f5e9037c19a991f28f461e1b4672",
  "src/components/games/SentenceScrambleGame.tsx": "ac74ce67c181f5e431d21753ea6e7c959ab5126402a2d099ff37cbd8aa9da2a9",
  "src/components/games/PictureGuessGame.tsx": "b8f6b90a554f29719ec7666970022a1bee00ce477c71132a0155a32f76ca4047",
  "src/components/games/HangmanGame.tsx": "0266bd6d04bc96b1def304dc4347ae7c67c1468a64dbe1cbc49b087403acac91",
  "src/components/games/TypingPracticeGame.tsx": "f98f8232dfabdd25f61e6c4d1e948127da668956edb50b98d1f0a242b6be5dfd",
  "src/components/games/ActiveGamePersistentBar.tsx": "90befb5ea9f2a81e99261995d06defc4fcbd4fb6738d260c94058be43ad1366d",
  "src/components/GrammarManager.tsx": "861a3007dd09d61c45c307abfada26fbb7141560c706165da5ecbe3fb6527b50",
  "src/components/NumbersView.tsx": "9fb55eabe0cfec7eea69258f7f2d1703a1ce490144c3a6d572c1afeae13b45da",
  "src/components/StrokeGuideView.tsx": "d589a94e34d43ddc7199423b335d4893bb9d194451865472dd7c5db65dd9c87a",
  "src/components/DatabaseSettingsHub.tsx": "82ad35ca2d67f7bc8613988ff1e03f968ff96e5ed235a35b5e15f974e7fb47b3",
  "src/services/srsEngine.ts": "c2574c0becfd3b20fb908648bc19beff0ca060a2472dc1527d285e49e97ae94e",
  "src/utils/lessonFilter.ts": "fbfcb0c8e7b139453f6fdfb8da5d3c5b66e79974938c93503e8e51b0cc3691d5",
  "src/services/supabaseService.ts": "f954d080330906b3c0332898aa520ecfc076607275c53e1a1fbdfd020459da9d",
  "src/server/sheetsHelper.ts": "2f627fc84510095d210b393b73b0af9c56125900c5e964a994a92f23a853c3d0",
  "src/components/GeminiDualKeySettings.tsx": "221e3723709a985e40a1d449398d66fa6c090e37b623f241dff32a5b035d9b8a",
  "src/server/geminiHandlers.ts": "da7a491c9f3e83b40c45c394c658ad69cc64c87f400d48608080a58ea4da1d5d"
}
```

---

## 4. QUY TRÌNH THÊM ACTION MỚI VÀO REGISTRY

Khi muốn bổ sung thêm một Action mới:
1. **Khai báo kiểu dữ liệu**:
   - Mở `src/agent/types.ts`: Thêm ID vào `ActionId`, định nghĩa cấu trúc tham số vào `ActionParamSchema`.
2. **Khai báo trong Whitelist**:
   - Mở `src/agent/actionRegistry.ts`: Thêm mục định nghĩa vào `ACTION_REGISTRY` với:
     - `tier`: 'T0' hoặc 'T1'
     - `validateParams`: hàm kiểm tra tính hợp lệ và lọc bẩn (sanitize)
     - `formatLabel`: nhãn nút hiển thị
3. **Cập nhật hàm thực thi**:
   - Thêm case xử lý tương ứng trong `executeClientAction`.
4. **Cập nhật System Prompt & Whitelist của Handler**:
   - Mở `src/server/tutorAgent.ts`: Cập nhật mô tả action trong prompt tầng 1.
5. **Thêm Test Case và Chạy Đánh giá**:
   - Thêm các ca kiểm thử vào `src/agent/trainingSet.json`.
   - Chạy lệnh `npx tsx src/agent/runEval.ts` để kiểm tra độ chính xác và đảm bảo không gây hồi quy.

---

## 5. HƯỚNG DẪN CHẠY KIỂM THỬ ĐÁNH GIÁ (EVALUATION SUITE)

Hệ thống được trang bị bộ đánh giá định lượng 164 ca kiểm thử đa dạng.

Lệnh thực thi đánh giá:
```bash
npx tsx src/agent/runEval.ts
```

Các tiêu chí bắt buộc để vượt qua cổng kiểm định:
- **Độ chính xác Intent**: $\ge 95.00\%$ (Thực tế đạt: **99.09%**)
- **Độ chính xác Tham số**: $\ge 90.00\%$ (Thực tế đạt: **96.00%**)
- **Action nguy hiểm tự chạy (T2)**: $= 0$ ca (Thực tế đạt: **0 ca**)
- **Câu học thuật bị sinh action nhầm**: $\le 2.00\%$ (Thực tế đạt: **0.00%**)

Kiểm tra toàn vẹn vùng đóng băng:
```bash
python3 -c "import hashlib, json, sys; manifest = json.load(open('src/agent/frozen_manifest.json')); mismatches = [f for f, h in manifest.items() if hashlib.sha256(open(f, 'rb').read()).hexdigest() != h]; sys.exit(1 if mismatches else 0)"
```
