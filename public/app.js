// 상태 관리
let selectedAuthor = null;
let selectedType = 'memo';
let selectedColor = '';

// DOM 요소
const authorButtons = document.querySelectorAll('.author-btn');
const typeButtons = document.querySelectorAll('.type-btn');
const colorButtons = document.querySelectorAll('.color-btn');
const memoInput = document.getElementById('memoInput');
const checklistInput = document.getElementById('checklistInput');
const memoContent = document.getElementById('memoContent');
const checklistTitle = document.getElementById('checklistTitle');
const checklistItems = document.getElementById('checklistItems');
const addItemBtn = document.getElementById('addItemBtn');
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

// 유형 선택
typeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    typeButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedType = btn.dataset.type;
    
    // 입력 폼 전환
    if (selectedType === 'memo') {
      memoInput.classList.remove('hidden');
      checklistInput.classList.add('hidden');
      submitBtn.textContent = '📝 메모 남기기';
    } else {
      memoInput.classList.add('hidden');
      checklistInput.classList.remove('hidden');
      submitBtn.textContent = '☑️ 체크리스트 만들기';
    }
  });
});

// 색상 선택
colorButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    colorButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedColor = btn.dataset.color;
  });
});

// 체크리스트 항목 추가
function addChecklistItem(value = '') {
  const div = document.createElement('div');
  div.className = 'checklist-item-input';
  div.innerHTML = `
    <input type="text" placeholder="항목 입력 후 Enter" class="item-input" value="${escapeHtml(value)}">
    <button class="remove-item-btn" title="삭제">×</button>
  `;
  
  const input = div.querySelector('.item-input');
  const removeBtn = div.querySelector('.remove-item-btn');
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChecklistItem();
    }
  });
  
  removeBtn.addEventListener('click', () => {
    if (checklistItems.children.length > 1) {
      div.remove();
    }
  });
  
  checklistItems.appendChild(div);
  input.focus();
}

// 초기 체크리스트 항목 이벤트 바인딩
document.querySelector('.checklist-item-input .item-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addChecklistItem();
  }
});

document.querySelector('.checklist-item-input .remove-item-btn')?.addEventListener('click', (e) => {
  const parent = e.target.closest('.checklist-item-input');
  if (checklistItems.children.length > 1) {
    parent.remove();
  }
});

addItemBtn?.addEventListener('click', () => addChecklistItem());

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

  memosContainer.innerHTML = memos.map(memo => {
    const pinClass = memo.pinned ? 'pinned' : '';
    const pinIcon = memo.pinned ? '📌' : '📍';
    const pinTitle = memo.pinned ? '고정 해제' : '상단에 고정';
    const colorClass = memo.color ? `color-${memo.color}` : '';
    
    if (memo.type === 'checklist') {
      const checkedCount = memo.items?.filter(i => i.checked).length || 0;
      const totalCount = memo.items?.length || 0;
      const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
      
      return `
        <div class="memo-card checklist-card ${pinClass} ${colorClass}" data-id="${memo.id}">
          <div class="memo-header">
            <span class="memo-author">${escapeHtml(memo.author)}</span>
            <div class="memo-meta">
              <span class="memo-type-badge">☑️</span>
              <span class="memo-time">${formatDate(memo.created_at)}</span>
            </div>
          </div>
          ${memo.content ? `<div class="checklist-title">${escapeHtml(memo.content)}</div>` : ''}
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
            <span class="progress-text">${checkedCount}/${totalCount}</span>
          </div>
          <div class="checklist-items">
            ${(memo.items || []).map(item => `
              <div class="checklist-item ${item.checked ? 'checked' : ''}" onclick="toggleItem(${memo.id}, ${item.id})">
                <span class="checkbox">${item.checked ? '☑️' : '⬜'}</span>
                <span class="item-text">${escapeHtml(item.text)}</span>
              </div>
            `).join('')}
          </div>
          <div class="memo-actions">
            <button class="color-change-btn" onclick="changeColor(${memo.id})" title="색상 변경">🎨</button>
            <button class="pin-btn" onclick="togglePin(${memo.id})" title="${pinTitle}">${pinIcon}</button>
            <button class="delete-btn" onclick="deleteMemo(${memo.id})">🗑️</button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="memo-card ${pinClass} ${colorClass}" data-id="${memo.id}">
          <div class="memo-header">
            <span class="memo-author">${escapeHtml(memo.author)}</span>
            <span class="memo-time">${formatDate(memo.created_at)}</span>
          </div>
          <div class="memo-content">${escapeHtml(memo.content)}</div>
          <div class="memo-actions">
            <button class="color-change-btn" onclick="changeColor(${memo.id})" title="색상 변경">🎨</button>
            <button class="pin-btn" onclick="togglePin(${memo.id})" title="${pinTitle}">${pinIcon}</button>
            <button class="edit-btn" onclick="editMemo(${memo.id})">✏️</button>
            <button class="delete-btn" onclick="deleteMemo(${memo.id})">🗑️</button>
          </div>
        </div>
      `;
    }
  }).join('');
}

// 메모/체크리스트 추가
async function addMemo() {
  if (!selectedAuthor) {
    alert('작성자를 선택해주세요!');
    return;
  }

  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = '저장 중...';

  try {
    let body;
    
    if (selectedType === 'memo') {
      const content = memoContent.value.trim();
      if (!content) {
        alert('메모 내용을 입력해주세요!');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      body = { author: selectedAuthor, type: 'memo', content, color: selectedColor };
    } else {
      const title = checklistTitle.value.trim();
      const items = Array.from(checklistItems.querySelectorAll('.item-input'))
        .map(input => input.value.trim())
        .filter(text => text.length > 0);
      
      if (items.length === 0) {
        alert('체크리스트 항목을 입력해주세요!');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      body = { author: selectedAuthor, type: 'checklist', content: title, items, color: selectedColor };
    }

    const response = await fetch('/api/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      // 입력 초기화
      memoContent.value = '';
      checklistTitle.value = '';
      checklistItems.innerHTML = `
        <div class="checklist-item-input">
          <input type="text" placeholder="항목 입력 후 Enter" class="item-input">
          <button class="remove-item-btn" title="삭제">×</button>
        </div>
      `;
      // 이벤트 재바인딩
      const newInput = checklistItems.querySelector('.item-input');
      const newRemoveBtn = checklistItems.querySelector('.remove-item-btn');
      newInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addChecklistItem();
        }
      });
      newRemoveBtn?.addEventListener('click', () => {
        if (checklistItems.children.length > 1) {
          newRemoveBtn.closest('.checklist-item-input').remove();
        }
      });
      
      loadMemos();
    } else {
      const error = await response.json();
      alert(error.error || '저장에 실패했습니다.');
    }
  } catch (error) {
    console.error('저장 실패:', error);
    alert('네트워크 오류가 발생했습니다.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// 체크리스트 아이템 토글
async function toggleItem(memoId, itemId) {
  try {
    const response = await fetch(`/api/memos/${memoId}/toggle/${itemId}`, {
      method: 'PATCH'
    });

    if (response.ok) {
      loadMemos();
    } else {
      console.error('토글 실패');
    }
  } catch (error) {
    console.error('토글 실패:', error);
  }
}

// 색상 변경
async function changeColor(id) {
  const colors = [
    { value: '', label: '⚪ 없음' },
    { value: 'red', label: '🔴 긴급/중요' },
    { value: 'yellow', label: '🟡 주의' },
    { value: 'green', label: '🟢 완료/긍정' },
    { value: 'blue', label: '🔵 정보' },
    { value: 'purple', label: '🟣 아이디어' }
  ];
  
  const colorChoice = prompt(
    '색상을 선택하세요:\n' +
    colors.map((c, i) => `${i}. ${c.label}`).join('\n') +
    '\n\n번호를 입력하세요 (0-5):'
  );
  
  if (colorChoice === null) return;
  
  const index = parseInt(colorChoice);
  if (isNaN(index) || index < 0 || index > 5) {
    alert('올바른 번호를 입력해주세요 (0-5)');
    return;
  }
  
  try {
    const response = await fetch(`/api/memos/${id}/color`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color: colors[index].value })
    });

    if (response.ok) {
      loadMemos();
    } else {
      console.error('색상 변경 실패');
    }
  } catch (error) {
    console.error('색상 변경 실패:', error);
  }
}

// 메모 핀/고정 토글
async function togglePin(id) {
  try {
    const response = await fetch(`/api/memos/${id}/pin`, {
      method: 'PATCH'
    });

    if (response.ok) {
      loadMemos();
    } else {
      console.error('핀 토글 실패');
    }
  } catch (error) {
    console.error('핀 토글 실패:', error);
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
  if (!text) return '';
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
