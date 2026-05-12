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

/* ===== УТИЛЫ ===== */

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

/* ===== СТАТИКА ===== */

app.get("/", async (req, res) => {
  const data = await readFile("index.html");
  res.setHeader("Content-Type", "text/html");
  res.send(data);
});

/* ===== БОТЫ ===== */

const valera = { nick: "Валера", color: "#ffaa00" };
const kisa   = { nick: "Киса", color: "#ff69b4" };

const valeraPhrases = [
  "че бля",
  "мда...",
  "чат мёртв",
  "ну и движ",
  "мне насрать",
  "2+2=5",
  "зима не лето, салат не котлета",
  "вы серьёзно?",
  "лол",
  "ееееееее",
  "супер чат",
  "я тут главный хаос",
  "вы NPC или живые?",
  "кринж уровень максимум",
  "я сейчас кого-то вынесу морально",
  "чат как всегда 💀",
  "вы вообще читаете что пишете?"
];

const kisaPhrases = [
  "ммм 😏",
  "ты милый",
  "интересно тут",
  "я просто читаю 👀",
  "хех",
  "мне нравится этот чат",
  "ребят, не ссорьтесь",
  "давайте чуть спокойнее",
  "вы забавные когда спорите",
  "ой, опять начинается...",
  "я за мир в этом цирке",
  "ну хватит уже, ребят",
  "Валера, остынь 😼"
];

function botMessage(bot, phrases) {
  if (!botsEnabled) return;

  let text = random(phrases);

  // 👇 реакция Валеры на агрессию
  if (bot.nick === "Валера" && lastMessage) {
    if (isAggressive(lastMessage.text)) {
      text = random([
        "ооо, токсик пошёл 💀",
        "да ты сам-то норм?",
        "я ща разнесу этот чат",
        "NPC detected",
        "кринж атака принята"
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

/* ===== КИСА (умный миротворец) ===== */

setInterval(() => {
  if (!botsEnabled) return;

  let text;

  if (lastMessage && isAggressive(lastMessage.text) && lastMessage.from !== "Киса") {
    text = random([
      "Валера, хватит уже 😼",
      "ребят, давайте без жести",
      "я сейчас вас разниму",
      "ну всё, успокоились оба",
      "давайте жить дружно"
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
}, 5000);

/* ===== ВАЛЕРА ===== */

setInterval(() => {
  if (Math.random() < 0.7) {
    botMessage(valera, valeraPhrases);
  }
}, 8000);

/* ===== SOCKET ===== */

io.on("connection", (socket) => {
  socket.emit("chat-history", messages);

  socket.on("set-nickname", (nick) => {
    if (!nick) return;

    socket.nickname = nick;
    socket.color = colorFromNick(nick);
    users.set(nick, socket.id);

    io.emit("system", `${nick} пришел с олимпа`);
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
      io.emit("system", `${socket.nickname} убежал плакать`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`чупапи муняню ${PORT}`);
});
