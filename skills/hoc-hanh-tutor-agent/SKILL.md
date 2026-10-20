---
name: hoc-hanh-tutor-agent
description: Hệ thống Gia sư AI đa nhiệm (Tutor Agent) với phân tầng action T0/T1/T2, bảo mật, prompt 2 tầng và bộ đánh giá 164 golden cases.
---

# HỌC HÀNH - TUTOR AGENT SKILL

Skill này tài liệu hóa kiến trúc và cách thức vận hành của hệ thống Gia sư AI Đa nhiệm (Tutor Agent) trong ứng dụng.

## 1. Bản đồ Action & Tier
- **T0 (Điều hướng & Đọc an toàn)**: 
  - `navigate`: Chuyển màn hình đích (`dashboard`, `levels`, `dictionary`, `vocabulary`, `grammar`, `games`, `mocktest`, `stroke`, `numbers`, `sheets`)
  - `open_game`: Mở game ôn tập (`flashcard`, `multiple_choice`, `matching`, `scramble`, `typing`, `listening`, `fill_blank`, `tone_practice`)
  - `open_vocabulary`: Mở từ vựng (kèm lọc cấp độ tùy chọn)
  - `open_grammar`: Mở ngữ pháp (kèm lọc cấp độ)
  - `open_dictionary`: Mở từ điển
  - `open_numbers`: Mở bảng đếm số
  - `open_stroke`: Mở luyện nét chữ
  - `open_mocktest`: Mở đề thi thử
  - `open_levels`: Mở chọn cấp độ
  - `open_settings_hub`: Mở trung tâm cài đặt
  - `set_language`: Đổi ngôn ngữ học tập (`vi`, `ko`, `zh`, `ja`, `en`, `fr`, `de`, `es`, `ru`)
  - `show_study_summary`: Hiển thị tiến độ và số từ đến hạn SRS hôm nay
- **T1 (Ghi dữ liệu có thể hoàn tác)**:
  - `add_vocabulary`: Thêm từ vựng mới (Bắt buộc xác nhận trước khi ghi)
  - `toggle_today_flashcard`: Ghim từ ôn tập trong ngày
  - `set_level`: Đặt cấp độ ngôn ngữ
- **T2 (Thao tác phá hủy / Đồng bộ nhạy cảm)**:
  - `clear_all_data`, `batch_delete`, `sync_cloud`: Gia sư AI từ chối thực thi tự động, điều hướng về Cài đặt để người dùng tự thao tác.

## 2. Ranh giới Vùng đóng băng
- Tuyệt đối KHÔNG chạm vào các service từ điển (`dictionaryService.ts`), OCR ảnh ngoài gia sư, các game ngoài luồng gia sư, và cơ chế Dual-Key Failover cốt lõi.
- Mọi thay đổi tuân thủ kiểm định `frozen_manifest.json` (sai lệch 1 byte là vi phạm).

## 3. Cách thêm Action mới
1. Khai báo actionId mới trong `src/agent/types.ts`.
2. Đăng ký metadata và schema tham số trong `src/agent/actionRegistry.ts`.
3. Viết hàm thực thi `execute` an toàn dùng lại các hàm từ `AppContext`.
4. Bổ sung test case vào `src/agent/trainingSet.json` và chạy `npx tsx src/agent/runEval.ts`.
