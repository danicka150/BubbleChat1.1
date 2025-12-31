import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFile, writeFile } from "fs/promises";

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

/* ===== ХРАНЕНИЕ ===== */
const CHAT_FILE = "./chat.json";
let messages = [];

try {
  messages = JSON.parse(await readFile(CHAT_FILE, "utf-8"));
} catch {
  messages = [];
}

function saveChat() {
  writeFile(CHAT_FILE, JSON.stringify(messages, null, 2));
}

/* ===== ПОЛЬЗОВАТЕЛИ ===== */
const users = new Map(); // nick -> socket.id

/* ===== ЦВЕТ НИКА ===== */
function colorFromNick(nick) {
  let hash = 0;
  for (let i = 0; i < nick.length; i++) {
    hash = nick.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

/* ===== СТАТИКА ===== */
app.get("/", async (req, res) => {
  const data = await readFile("index.html");
  res.setHeader("Content-Type", "text/html");
  res.send(data);
});

/* ===== УТИЛ ===== */
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ===== БОТЫ ===== */
let botsEnabled = true;

const valera = { nick: "Валера", color: "#ffaa00" };
const kisa   = { nick: "Киса",   color: "#ff69b4" };

const valeraPhrases = [
  "че бля",
  "мда...",
  "чат мёртв",
  "ну и движ",
  "мне насрать",
  "2+2=5",
  "зима не лето, салат не котлета",
  "вы серьёзно?",
  "лол"
];

const kisaPhrases = [
  "ммм 😏",
  "ты милый",
  "интересно тут",
  "я просто читаю 👀",
  "хех",
  "мне нравится этот чат"
];

function botMessage(bot, phrases) {
  if (!botsEnabled) return;

  const msg = {
    from: bot.nick,
    color: bot.color,
    to: null,
    text: random(phrases),
    time: Date.now(),
    bot: true
  };

  messages.push(msg);
  saveChat();
  io.emit("chat-message", msg);
}

/* ===== АВТОПИСАНИЕ БОТОВ ===== */
setInterval(() => {
  if (Math.random() < 0.7) {
    botMessage(valera, valeraPhrases);
  }
}, 8000);

setInterval(() => {
  if (Math.random() < 0.85) {
    botMessage(kisa, kisaPhrases);
  }
}, 6000);

/* ===== SOCKET ===== */
io.on("connection", (socket) => {

  // отправляем историю
  socket.emit("chat-history", messages);

  /* === НИК === */
  socket.on("set-nickname", (nick) => {
    if (!nick) return;

    socket.nickname = nick;
    socket.color = colorFromNick(nick);
    users.set(nick, socket.id);

    io.emit("system", `${nick} вошёл`);
  });

  /* === СООБЩЕНИЯ === */
  socket.on("chat-message", ({ text, to = null }) => {
    if (!socket.nickname || !text) return;

    const msg = {
      from: socket.nickname,
      color: socket.color,
      to, // null = общий, ник = ЛС
      text,
      time: Date.now(),
      bot: false
    };

    messages.push(msg);
    saveChat();

    // ВСЕМ, клиент сам фильтрует
    io.emit("chat-message", msg);
  });

  /* === ВКЛ/ВЫКЛ БОТОВ === */
  socket.on("toggle-bots", () => {
    botsEnabled = !botsEnabled;
    io.emit("system", `Боты ${botsEnabled ? "включены" : "выключены"}`);
  });

  socket.on("disconnect", () => {
    if (socket.nickname) {
      users.delete(socket.nickname);
      io.emit("system", `${socket.nickname} вышел`);
    }
  });
});

/* ===== START ===== */
server.listen(PORT, () => {
  console.log(`BubbleChat запущен на порту ${PORT}`);
});
