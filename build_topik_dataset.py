# -*- coding: utf-8 -*-
import json
import datetime
from parse_topik_dataset import words_data

now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
today_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")

# 1. Read cloud_store.json
with open('cloud_store.json', 'r', encoding='utf-8') as f:
    store = json.load(f)

vocab_list = store.get('vocabulary', [])
decks_list = store.get('decks', [])

# Map existing Korean words by canonical Hangul
existing_ko_map = {}
for idx, w in enumerate(vocab_list):
    if w.get('ngon_ngu') == 'ko':
        canonical = (w.get('tu') or '').strip().lower()
        if canonical:
            existing_ko_map[canonical] = idx

updated_count = 0
added_count = 0
topik_word_ids = []
topik_vocab_export = []

for idx, (tu, romaja, nghia, pos, topic, ex_ko, ex_vi) in enumerate(words_data):
    canonical = tu.strip().lower()
    
    if canonical in existing_ko_map:
        word_index = existing_ko_map[canonical]
        w = vocab_list[word_index]
        word_id = w.get('word_id') or f"w_topik_{idx+1:03d}"
        w['word_id'] = word_id
        w['bai_hoc'] = "Ôn thi topik"
        w['is_starred'] = True
        w['is_added_today_flashcard'] = True
        w['added_to_today_flashcard_at'] = now_iso
        
        # Enrich if empty or generic
        if not w.get('phien_am') or w.get('phien_am') == '[]':
            w['phien_am'] = f"[{romaja}]"
        if not w.get('vi_du') or len(w.get('vi_du', '')) < 5:
            w['vi_du'] = ex_ko
            w['vi_du_dich'] = ex_vi
        if not w.get('chu_de') or w.get('chu_de') == 'Tổng hợp':
            w['chu_de'] = topic
        if not w.get('loai_tu') or w.get('loai_tu') in ['Từ vựng', '']:
            w['loai_tu'] = pos
        if not w.get('cap_do') or 'TOPIK' not in w.get('cap_do', ''):
            w['cap_do'] = 'TOPIK 1 (Sơ cấp 1)'
            
        updated_count += 1
        topik_word_ids.append(word_id)
        topik_vocab_export.append(w)
    else:
        word_id = f"w_topik_{idx+1:03d}"
        new_word = {
            "word_id": word_id,
            "tu": tu.strip(),
            "nghia": nghia.strip(),
            "phien_am": f"[{romaja.strip()}]",
            "loai_tu": pos.strip(),
            "vi_du": ex_ko.strip(),
            "vi_du_dich": ex_vi.strip(),
            "nghia_tieng_han": "",
            "nghia_tieng_anh": "",
            "phien_am_tieng_han": "",
            "ngon_ngu": "ko",
            "chu_de": topic.strip(),
            "cap_do": "TOPIK 1 (Sơ cấp 1)",
            "bai_hoc": "Ôn thi topik",
            "nguon_goc": "TOPIK I 400 Từ vựng Ưu Tiên",
            "retention_level": "chua_danh_gia",
            "is_added_today_flashcard": True,
            "is_starred": True,
            "added_to_today_flashcard_at": now_iso,
            "srs_box": 0,
            "srs_next_review": now_iso,
            "srs_interval": 0,
            "srs_ease": 2.5,
            "times_reviewed": 0,
            "times_correct": 0,
            "user_id": "user_1",
            "created_at": today_str
        }
        vocab_list.append(new_word)
        added_count += 1
        topik_word_ids.append(word_id)
        topik_vocab_export.append(new_word)

store['vocabulary'] = vocab_list

# Update or add Deck 'Ôn thi topik'
deck_found = False
for d in decks_list:
    if d.get('ten_bo') == 'Ôn thi topik' or d.get('deck_id') == 'deck_topik_1_400':
        d['danh_sach_word_id'] = topik_word_ids
        d['ngon_ngu'] = 'ko'
        d['ten_bo'] = 'Ôn thi topik'
        d['ten_deck'] = 'Ôn thi topik'
        deck_found = True
        break

if not deck_found:
    decks_list.append({
        "deck_id": "deck_topik_1_400",
        "ten_bo": "Ôn thi topik",
        "ten_deck": "Ôn thi topik",
        "ngon_ngu": "ko",
        "mo_ta": "400 từ vựng TOPIK I ưu tiên học hàng đầu (kèm đánh dấu Flashcard)",
        "nguoi_tao": "user_1",
        "danh_sach_word_id": topik_word_ids,
        "che_do_chia_se": "shared",
        "color": "from-amber-500 to-orange-600",
        "icon": "🎯",
        "created_at": now_iso
    })

store['decks'] = decks_list
store['lastUpdated'] = now_iso

# Save back to cloud_store.json
with open('cloud_store.json', 'w', encoding='utf-8') as f:
    json.dump(store, f, ensure_ascii=False, indent=2)

# Save seed export json for frontend initialization
with open('src/data/koreanTopikVocabData.json', 'w', encoding='utf-8') as f:
    json.dump(topik_vocab_export, f, ensure_ascii=False, indent=2)

print(f"Processed: {len(words_data)} total TOPIK words.")
print(f"Updated existing words: {updated_count}")
print(f"Added new words: {added_count}")
print(f"Total vocabulary in cloud_store.json: {len(vocab_list)}")
print(f"Total decks in cloud_store.json: {len(decks_list)}")
print(f"Saved src/data/koreanTopikVocabData.json with {len(topik_vocab_export)} items.")
