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

/* ===== UTILS ===== */

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

/* ===== ФРАЗОВЫЙ ГЕНЕРАТОР (убирает повторяемость) ===== */

const vibes = [
  "интересный ты",
  "странный ты",
  "шумный ты",
  "уверенный ты",
  "забавный ты",
  "опасно уверенный ты",
  "слишком громкий ты"
];

const endings = [
  "но ладно",
  "но окей",
  "но интересно",
  "но странно",
  "и это факт",
  "и это забавно",
  "я наблюдаю"
];

function buildPhrase(prefixes, subjects) {
  const a = random(prefixes);
  const b = random(subjects);
  const c = random(endings);
  return `${a}, ${b}... ${c}`;
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

/* 🔥 ВАЛЕРА — расширенный пул */
const valeraBase = [
  "чат как обычно живёт своей жизнью",
  "я тут главный хаос",
  "вы серьёзно это обсуждаете?",
  "мне даже немного смешно",
  "я наблюдаю за этим цирком",
  "кринж стабилен",
  "вы все NPC, но разные версии",
  "ладно, ты не самый худший тут",
  "я бы поспорил, но лень",
  "ты опять отличился"
];

/* 😼 КИСА — короткая элита */
const kisaBase = [
  "ок",
  "понятно",
  "интересно",
  "шумно",
  "почти",
  "забавно",
  "логично",
  "нет",
  "возможно",
  "наблюдаю",
  "неплохо",
  "слишком уверенно",
  "я поняла"
];

/* ===== BOT CORE ===== */

function botMessage(bot, base) {
  if (!botsEnabled) return;

  let text;

  if (bot.nick === "Валера") {
    // иногда генератор, иногда база
    text = Math.random() < 0.5
      ? buildPhrase(vibes, base)
      : random(base);

    if (lastMessage && isAggressive(lastMessage.text)) {
      text = random([
        "ты сейчас перегнул",
        "смело, но глупо",
        "NPC detected",
        "я это даже комментировать не хочу",
        "чат упростился до конфликта"
      ]);
    }
  } else {
    text = Math.random() < 0.6
      ? buildPhrase(["ты", "это", "всё"], kisaBase)
      : random(kisaBase);
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
      "ты снова шумишь",
      "Валера, хватит",
      "я наблюдаю за тобой",
      "слишком заметный"
    ]);
  } else {
    text = random(kisaBase);
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
  if (Math.random() < 0.8) {
    botMessage(valera, valeraBase);
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

  socket.on("chat-message", ({ text }) => {
    if (!socket.nickname || !text) return;

    const msg = {
      from: socket.nickname,
      color: socket.color,
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
 
