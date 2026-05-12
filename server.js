import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFile, writeFile } from "fs/promises";

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const CHAT_FILE = "./chat.json";

let messages = [];
let lastMessage = null;
let botsEnabled = true;

try {
  messages = JSON.parse(await readFile(CHAT_FILE, "utf-8"));
} catch {
  messages = [];
}

function saveChat() {
  writeFile(CHAT_FILE, JSON.stringify(messages, null, 2));
}

const users = new Map();

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function colorFromNick(nick) {
  let hash = 0;
  for (let i = 0; i < nick.length; i++) {
    hash = nick.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

function isAggressive(text = "") {
  const bad = ["лох", "идиот", "дурак", "сдох", "npc", "туп", "дебил"];
  return bad.some(w => text.toLowerCase().includes(w));
}

/* ===== STATIC ===== */

app.get("/", async (req, res) => {
  const data = await readFile("index.html");
  res.setHeader("Content-Type", "text/html");
  res.send(data);
});

/* ===== BOTS ===== */

const valera = { nick: "Валера", color: "#ffaa00" };
const kisa   = { nick: "Киса", color: "#ff69b4" };

/* 🔥 ВАЛЕРА — теперь снова тролль + хаос + немного “смысла” */
const valeraPhrases = [
  "че бля, вы тут опять?",
  "чат как обычно умер и ожил",
  "мне насрать, но смешно",
  "вы серьёзно это пишете?",
  "лол, вы NPC все",
  "я тут главный клоун",
  "да вы все странные",
  "кринж уровень: стабильно высокий",
  "я ща кого-то морально вынесу",
  "зачем я это читаю вообще",
  "ну вы даёте конечно 💀",
  "интересный ты тип, не спорю",
  "ты шумный, но не пустой",
  "ладно, ты почти норм",
  "я тебя даже немного уважаю (ошибка системы)",
  "ты как баг, который не фиксится",
  "чат без меня бы сдох",
  "хах, смешно наблюдать"
];

/* 😼 КИСА — короткая элита + обычные реакции + лёгкий флирт */
const kisaPhrases = [
  "ммм",
  "понятно",
  "интересно",
  "окей",
  "слишком громко",
  "ты стараешься",
  "почти хорошо",
  "я поняла",
  "логики мало",
  "забавно",
  "ты предсказуем",
  "неплохо",
  "слишком много шума",
  "хех",
  "ты мило тупишь иногда",
  "Валера опять шумит",
  "я наблюдаю",
  "мне всё равно, но интересно",
  "ты не безнадёжен"
];

/* ===== BOT CORE ===== */

function botMessage(bot, phrases) {
  if (!botsEnabled) return;

  let text = random(phrases);

  if (bot.nick === "Валера" && lastMessage) {
    if (isAggressive(lastMessage.text)) {
      text = random([
        "ооо, токсик пошёл 💀",
        "смело, но тупо",
        "ты сейчас перегнул",
        "NPC detected",
        "я это даже не буду комментировать"
      ]);
    }
  }

  const msg = {
    from: bot.nick,
    color: bot.color,
    to: null,
    text,
    time: Date.now(),
    bot: true
  };

  lastMessage = msg;

  messages.push(msg);
  saveChat();
  io.emit("chat-message", msg);
}

/* ===== КИСА ===== */

setInterval(() => {
  if (!botsEnabled) return;

  let text;

  if (lastMessage && lastMessage.from === "Валера") {
    text = random([
      "Валера, ты опять шумный",
      "слишком стараешься",
      "я наблюдаю за тобой",
      "не перегибай"
    ]);
  } else {
    text = random(kisaPhrases);
  }

  const msg = {
    from: kisa.nick,
    color: kisa.color,
    to: null,
    text,
    time: Date.now(),
    bot: true
  };

  lastMessage = msg;

  messages.push(msg);
  saveChat();
  io.emit("chat-message", msg);
}, 6500);

/* ===== ВАЛЕРА ===== */

setInterval(() => {
  if (Math.random() < 0.75) {
    botMessage(valera, valeraPhrases);
  }
}, 7000);

/* ===== SOCKET ===== */

io.on("connection", (socket) => {
  socket.emit("chat-history", messages);

  socket.on("set-nickname", (nick) => {
    if (!nick) return;

    socket.nickname = nick;
    socket.color = colorFromNick(nick);
    users.set(nick, socket.id);

    io.emit("system", `${nick} вошёл в чат`);
  });

  socket.on("chat-message", ({ text, to = null }) => {
    if (!socket.nickname || !text) return;

    const msg = {
      from: socket.nickname,
      color: socket.color,
      to,
      text,
      time: Date.now(),
      bot: false
    };

    lastMessage = msg;

    messages.push(msg);
    saveChat();
    io.emit("chat-message", msg);
  });

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

server.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
