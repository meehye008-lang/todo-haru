// 명세 ③: 추가 → 목록 맨 아래에 · 체크 → 줄이 그어지고 남은 개수 −1 · 삭제 → 목록에서 사라짐
// 완료 조건: 빈 칸은 추가 안 됨 · 체크하면 남은 개수가 바로 바뀜 · 새로고침해도 남음 · 휴대폰에서 쓸 수 있음
// 할 일은 Supabase의 todos 표에 저장한다 (칸: id, text, done, created_at)

const SUPABASE_URL = 'https://avncnqggyxjhatzfahko.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TYQXb62GkBxIvOiP4CQQtQ_QW9WD4L-';  // 공개 키만 쓴다
const TABLE_URL = SUPABASE_URL + '/rest/v1/todos';

// todos 표에는 별표 칸이 없어서, 별표는 이 브라우저에 id만 따로 저장한다
const STAR_KEY = 'todo-stars';

let items = [];  // [{ id, text, done, created_at }, ...] 오래된 것부터

function loadStars() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STAR_KEY) || '[]'));
  } catch (e) {
    return new Set();
  }
}

function saveStars(stars) {
  try {
    localStorage.setItem(STAR_KEY, JSON.stringify([...stars]));
  } catch (e) {
    // 저장이 막혀 있어도 화면은 계속 동작한다
  }
}

// Supabase 표에 요청을 보낸다. 실패하면 에러를 던진다
async function request(query, options) {
  const response = await fetch(TABLE_URL + query, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
      ...(options && options.headers),
    },
  });
  if (!response.ok) throw new Error('Supabase ' + response.status + ' ' + (await response.text()));
  return response.status === 204 ? null : response.json();
}

function showError(error) {
  console.error(error);
  alert('표에 저장하지 못했어요. 인터넷과 Supabase 설정(표 권한)을 확인해 주세요.');
}

async function loadItems() {
  try {
    items = await request('?select=*&order=created_at.asc,id.asc');
  } catch (error) {
    showError(error);
  }
  render();
}

async function addItem(text) {
  try {
    const rows = await request('?select=*', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ text: text, done: false }),  // 목록 맨 아래에
    });
    items.push(rows[0]);
  } catch (error) {
    showError(error);
  }
  render();
}

async function setDone(item, done) {
  try {
    await request('?id=eq.' + encodeURIComponent(item.id), {
      method: 'PATCH',
      body: JSON.stringify({ done: done }),
    });
    item.done = done;
  } catch (error) {
    showError(error);
  }
  render();
}

async function removeItem(item) {
  try {
    await request('?id=eq.' + encodeURIComponent(item.id), { method: 'DELETE' });
    items = items.filter((other) => other !== item);
    const stars = loadStars();
    stars.delete(String(item.id));
    saveStars(stars);
  } catch (error) {
    showError(error);
  }
  render();
}

function toggleStar(item) {
  const stars = loadStars();
  const id = String(item.id);
  if (stars.has(id)) stars.delete(id);
  else stars.add(id);
  saveStars(stars);
  render();
}

function render() {
  const list = document.querySelector('#list');
  list.innerHTML = '';
  const stars = loadStars();
  const isStar = (item) => stars.has(String(item.id));

  // 별표 한 일을 맨 위로: 보이는 순서만 바꾸고, 저장된 순서(items)는 그대로 둔다
  const order = items.map((item, i) => i);
  order.sort((a, b) => Number(isStar(items[b])) - Number(isStar(items[a])) || a - b);

  order.forEach((i) => {
    const item = items[i];
    const li = document.createElement('li');
    if (item.done) li.classList.add('done');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = item.done;
    check.addEventListener('change', () => setDone(item, check.checked));

    const label = document.createElement('span');
    label.textContent = item.text;

    const star = document.createElement('button');
    star.type = 'button';
    star.className = isStar(item) ? 'star on' : 'star';
    star.textContent = isStar(item) ? '★' : '☆';
    star.setAttribute('aria-label', '중요 표시');
    star.setAttribute('aria-pressed', isStar(item) ? 'true' : 'false');
    star.addEventListener('click', () => toggleStar(item));

    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '삭제';
    del.addEventListener('click', () => removeItem(item));

    li.append(check, label, star, del);
    list.append(li);
  });
  // 남은 개수 = 체크하지 않은 것
  document.querySelector('#count').textContent = items.filter((item) => !item.done).length;
}

const button = document.querySelector('#add');
button.addEventListener('click', () => {
  const input = document.querySelector('#item');
  const text = input.value.trim();
  if (text === '') return;   // 빈 칸이면 멈춘다
  addItem(text);             // 표에 추가한다
  input.value = '';
  input.focus();
});

// 입력칸에서 Enter를 눌러도 추가된다
document.querySelector('#item').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.isComposing) button.click();
});

// 제목 아래에 오늘 날짜를 보여 준다 (예: 2026년 10월 26일 월요일)
document.querySelector('#today').textContent = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

render();
loadItems();
