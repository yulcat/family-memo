const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3456;
const DATA_FILE = path.join(__dirname, 'data', 'memos.json');

// 데이터 디렉토리 생성
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 데이터 로드
function loadMemos() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('데이터 로드 오류:', error);
  }
  return [];
}

// 데이터 저장
function saveMemos(memos) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memos, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('데이터 저장 오류:', error);
    return false;
  }
}

// 미들웨어
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: 모든 메모 조회
app.get('/api/memos', (req, res) => {
  try {
    const memos = loadMemos();
    res.json(memos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (error) {
    console.error('메모 조회 오류:', error);
    res.status(500).json({ error: '메모를 불러오는데 실패했습니다.' });
  }
});

// API: 메모 추가
app.post('/api/memos', (req, res) => {
  try {
    const { author, content } = req.body;
    if (!author || !content) {
      return res.status(400).json({ error: '작성자와 내용을 입력해주세요.' });
    }
    
    const memos = loadMemos();
    const newMemo = {
      id: Date.now(),
      author,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    memos.push(newMemo);
    
    if (saveMemos(memos)) {
      res.status(201).json(newMemo);
    } else {
      res.status(500).json({ error: '메모 저장에 실패했습니다.' });
    }
  } catch (error) {
    console.error('메모 추가 오류:', error);
    res.status(500).json({ error: '메모 추가에 실패했습니다.' });
  }
});

// API: 메모 수정
app.put('/api/memos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '내용을 입력해주세요.' });
    }
    
    const memos = loadMemos();
    const memoIndex = memos.findIndex(m => m.id === parseInt(id));
    
    if (memoIndex === -1) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
    }
    
    memos[memoIndex].content = content;
    memos[memoIndex].updated_at = new Date().toISOString();
    
    if (saveMemos(memos)) {
      res.json(memos[memoIndex]);
    } else {
      res.status(500).json({ error: '메모 저장에 실패했습니다.' });
    }
  } catch (error) {
    console.error('메모 수정 오류:', error);
    res.status(500).json({ error: '메모 수정에 실패했습니다.' });
  }
});

// API: 메모 삭제
app.delete('/api/memos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const memos = loadMemos();
    const memoIndex = memos.findIndex(m => m.id === parseInt(id));
    
    if (memoIndex === -1) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
    }
    
    memos.splice(memoIndex, 1);
    
    if (saveMemos(memos)) {
      res.json({ message: '메모가 삭제되었습니다.' });
    } else {
      res.status(500).json({ error: '메모 삭제에 실패했습니다.' });
    }
  } catch (error) {
    console.error('메모 삭제 오류:', error);
    res.status(500).json({ error: '메모 삭제에 실패했습니다.' });
  }
});

// SPA 라우팅
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`🏠 가족 메모장이 http://localhost:${PORT} 에서 실행 중입니다`);
});

// 안정적인 종료 처리
process.on('SIGTERM', () => {
  console.log('서버 종료 중...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('서버 종료 중...');
  server.close(() => {
    process.exit(0);
  });
});

// 예상치 못한 에러 처리
process.on('uncaughtException', (error) => {
  console.error('예상치 못한 오류:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('처리되지 않은 Promise 거부:', reason);
});
