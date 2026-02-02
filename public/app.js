// 상태 관리
let selectedAuthor = null;

// DOM 요소
const authorButtons = document.querySelectorAll('.author-btn');
const memoContent = document.getElementById('memoContent');
const submitBtn = document.getElementById('submitMemo');
const memosContainer = document.getElementById('memos');

// 작성자 선택
authorButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    authorButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedAuthor = btn.dataset.author;
  });
});

// 메모 목록 불러오기
async function loadMemos() {
  try {
    const response = await fetch('/api/memos');
    const memos = await response.json();
    renderMemos(memos);
  } catch (error) {
    console.error('메모 로딩 실패:', error);
    memosContainer.innerHTML = '<div class="empty-state"><div class="emoji">😢</div><p>메모를 불러오는데 실패했습니다.</p></div>';
  }
}

// 메모 렌더링
function renderMemos(memos) {
  if (memos.length === 0) {
    memosContainer.innerHTML = '<div class="empty-state"><div class="emoji">📝</div><p>아직 메모가 없어요.<br>첫 번째 메모를 남겨보세요!</p></div>';
    return;
  }

  memosContainer.innerHTML = memos.map(memo => `
    <div class="memo-card" data-id="${memo.id}">
      <div class="memo-header">
        <span class="memo-author">${escapeHtml(memo.author)}</span>
        <span class="memo-time">${formatDate(memo.created_at)}</span>
      </div>
      <div class="memo-content">${escapeHtml(memo.content)}</div>
      <div class="memo-actions">
        <button class="edit-btn" onclick="editMemo(${memo.id})">✏️ 수정</button>
        <button class="delete-btn" onclick="deleteMemo(${memo.id})">🗑️ 삭제</button>
      </div>
    </div>
  `).join('');
}

// 메모 추가
async function addMemo() {
  if (!selectedAuthor) {
    alert('작성자를 선택해주세요!');
    return;
  }
  
  const content = memoContent.value.trim();
  if (!content) {
    alert('메모 내용을 입력해주세요!');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '저장 중...';

  try {
    const response = await fetch('/api/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: selectedAuthor, content })
    });

    if (response.ok) {
      memoContent.value = '';
      loadMemos();
    } else {
      const error = await response.json();
      alert(error.error || '메모 추가에 실패했습니다.');
    }
  } catch (error) {
    console.error('메모 추가 실패:', error);
    alert('네트워크 오류가 발생했습니다.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '📝 메모 남기기';
  }
}

// 메모 수정
async function editMemo(id) {
  const card = document.querySelector(`.memo-card[data-id="${id}"]`);
  const contentEl = card.querySelector('.memo-content');
  const currentContent = contentEl.textContent;
  
  const newContent = prompt('메모 수정:', currentContent);
  if (newContent === null || newContent.trim() === '') return;

  try {
    const response = await fetch(`/api/memos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent.trim() })
    });

    if (response.ok) {
      loadMemos();
    } else {
      const error = await response.json();
      alert(error.error || '메모 수정에 실패했습니다.');
    }
  } catch (error) {
    console.error('메모 수정 실패:', error);
    alert('네트워크 오류가 발생했습니다.');
  }
}

// 메모 삭제
async function deleteMemo(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    const response = await fetch(`/api/memos/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadMemos();
    } else {
      const error = await response.json();
      alert(error.error || '메모 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('메모 삭제 실패:', error);
    alert('네트워크 오류가 발생했습니다.');
  }
}

// 유틸리티 함수들
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  // 1시간 이내
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return minutes <= 0 ? '방금 전' : `${minutes}분 전`;
  }
  
  // 24시간 이내
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}시간 전`;
  }
  
  // 그 외
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 이벤트 리스너
submitBtn.addEventListener('click', addMemo);
memoContent.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    addMemo();
  }
});

// 초기 로드
loadMemos();

// 30초마다 자동 새로고침
setInterval(loadMemos, 30000);
