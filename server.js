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

/* ===== STATIC ===== */

app.get("/", async (req, res) => {
  const data = await readFile("index.html");
  res.setHeader("Content-Type", "text/html");
  res.send(data);
});

/* ===== BOTS ===== */

const valera = { nick: "Валера", color: "#ffaa00" };
const kisa   = { nick: "Киса", color: "#ff69b4" };

/* 🔥 ВАЛЕРА — тролль с интересом к людям */
const valeraPhrases = [
  "ты странный, но в этом есть стиль",
  "я бы поспорил, но ты слишком уверенно несёшь чушь",
  "интересный ты тип, не спорю",
  "у тебя мышление как баг, но стабильный",
  "я тебя почти уважаю, и это пугает",
  "ты шумный, но не пустой",
  "ладно, ты не безнадёжен",
  "ты как эксперимент, который вышел из-под контроля",
  "я не злюсь, мне просто любопытно наблюдать",
  "ты слишком уверенный для такого результата",
  "чат бы без тебя был скучнее"
];

/* 😼 КИСА — холодная элита, минимум слов */
const kisaPhrases = [
  "интересно",
  "неплохо",
  "слишком громко",
  "почти достойно",
  "ты стараешься",
  "забавно",
  "я поняла",
  "логики мало, но стиль есть",
  "ты предсказуем",
  "почти впечатлил"
];

/* ===== BOT CORE ===== */

function botMessage(bot, phrases) {
  if (!botsEnabled) return;

  let text = random(phrases);

  // Валера реагирует на агрессию пользователей
  if (bot.nick === "Валера" && lastMessage) {
    if (isAggressive(lastMessage.text)) {
      text = random([
        "ооо, ты сейчас перегнул",
        "смело, но глупо",
        "я бы не советовал тебе продолжать",
        "чат сейчас упростился до уровня ссоры",
        "NPC detected"
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

/* ===== КИСА (реакции + флирт с Валерой) ===== */

setInterval(() => {
  if (!botsEnabled) return;

  let text;

  // если Валера недавно писал → лёгкий флирт-подкол
  if (lastMessage && lastMessage.from === "Валера") {
    text = random([
      "ты опять стараешься быть громким",
      "Валера, ты забавный сегодня",
      "слишком много тебя в воздухе",
      "я наблюдаю за тобой"
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
