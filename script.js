const input = document.getElementById("item");
const addButton = document.getElementById("add");
const list = document.getElementById("list");
const count = document.getElementById("count");
const empty = document.getElementById("empty");

const STORAGE_KEY = "todo-haru";

// 할 일 목록: [{ text: "글", done: false }, ...]
let todos = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (e) {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    // 저장이 막혀 있어도 화면은 계속 동작한다
  }
}

function render() {
  list.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    if (todo.done) li.className = "done";

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = todo.done;
    check.addEventListener("change", () => {
      todos[index].done = check.checked;
      update();
    });

    const text = document.createElement("span");
    text.textContent = todo.text;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "삭제";
    remove.addEventListener("click", () => {
      todos.splice(index, 1);
      update();
    });

    li.append(check, text, remove);
    list.appendChild(li);
  });

  count.textContent = todos.filter((todo) => !todo.done).length;
  empty.hidden = todos.length > 0;
}

function update() {
  save();
  render();
}

function addTodo() {
  const text = input.value.trim();
  if (text === "") return;

  todos.push({ text: text, done: false });
  input.value = "";
  update();
}

addButton.addEventListener("click", addTodo);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTodo();
});

render();
