const fs = require('fs');
const path = require('path');

// 1. Update englishGrammarData.json
const engGrammarPath = path.join(__dirname, '../src/data/englishGrammarData.json');
if (fs.existsSync(engGrammarPath)) {
  const engGrammar = JSON.parse(fs.readFileSync(engGrammarPath, 'utf8'));
  const updatedEngGrammar = engGrammar.map((item, idx) => {
    let bai = item.bai_hoc;
    if (!bai && item.tags) {
      const found = item.tags.find((t) => /^Bài\s*\d+/i.test(t));
      if (found) bai = found;
    }
    if (!bai) {
      const lessonNum = Math.floor(idx / 3) + 1;
      bai = `Bài ${lessonNum}`;
    }
    return { ...item, bai_hoc: bai };
  });
  fs.writeFileSync(engGrammarPath, JSON.stringify(updatedEngGrammar, null, 2), 'utf8');
  console.log('Updated englishGrammarData.json with bai_hoc count:', updatedEngGrammar.length);
}

// 2. Fix & Update englishVocabData.json
const engVocabPath = path.join(__dirname, '../src/data/englishVocabData.json');
if (fs.existsSync(engVocabPath)) {
  const rawContent = fs.readFileSync(engVocabPath, 'utf8');
  let engVocab = [];
  try {
    engVocab = JSON.parse(rawContent);
  } catch (e) {
    const endIdx = rawContent.indexOf('Applying the concept of');
    if (endIdx > 0) {
      const validSub = rawContent.substring(0, endIdx);
      const lastBracket = validSub.lastIndexOf('}');
      const jsonStr = validSub.substring(0, lastBracket + 1) + ']';
      engVocab = JSON.parse(jsonStr);
    }
  }

  // Assign lessons to vocabulary items (10 items per lesson)
  const updatedEngVocab = engVocab.map((item, idx) => {
    let bai = item.bai_hoc;
    if (!bai && item.chu_de) {
      bai = `Bài ${Math.floor(idx / 10) + 1}: ${item.chu_de}`;
    } else if (!bai) {
      bai = `Bài ${Math.floor(idx / 10) + 1}`;
    }
    return { ...item, bai_hoc: bai };
  });

  fs.writeFileSync(engVocabPath, JSON.stringify(updatedEngVocab, null, 2), 'utf8');
  console.log('Updated englishVocabData.json with bai_hoc count:', updatedEngVocab.length);
}
