import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFile } from "fs/promises";

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

/* ------------------ отдаём index.html ------------------ */
app.get("/", async (req, res) => {
  try {
    const data = await readFile("index.html");
    res.setHeader("Content-Type", "text/html");
    res.send(data);
  } catch (err) {
    console.error("Read index.html error:", err);
    res.status(500).send("Ошибка сервера");
  }
});

/* --------------- утилиты: цвета никнеймов -------------- */
function getRandomColor() {
  const colors = ["#ff4040", "#40ff40", "#4040ff", "#ff80ff", "#ffff40", "#40ffff", "#ffaa00", "#a56cff"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ===================== ВАЛЕРА-БОТ ===================== */
const valera = {
  nick: "Валера",
  color: "#ffaa00",
  joined: false
};

const valeraRandomPhrases = [
  "Кто вообще тут?",
  "Чё молчим?",
  "Я тут сижу, если что.",
  "Аууу, люди?",
  "Ща бы пожрать…",
  "Кто-то вообще умеет писать?",
  "Эх… скучно.",
  "Чат умер?",
  "Пойду в окно посмотрю. Шутка, я бот.",
  "че бля",
  "мда...",
  "что за ерунда?",
  "вы серьёзно?",
  "ох уж эти люди...",
  "лол, опять вы",
  "иди на хуй",
  "ты охуел?",
  "да ну нахуй",
  "ёбаный чат",
  "ну и долбоёбы тут сидят",
  "мне насрать",
  "опять эти мудаки"
];

const valeraCompliments = [
  "я влюблен в твою красоту",
  "ты сияешь сегодня",
  "твой стиль просто бомбический"
];

const valeraTrolls = [
  "ну ты и клоун конечно...",
  "мда… что за бред",
  "лучше бы молчал",
  "я IQ теряю, читая тебя",
  "ох уж эти идиоты",
  "ну и глупость"
];

/* ===================== КИСА-БОТ ===================== */
const kisa = {
  nick: "Киса",
  color: "#ff69b4",
  joined: false,
  phrases: [
    "ты такой интересный",
    "с тобой так интересно",
    "ммм, интересно общаться",
    "ух ты, как круто"
  ]
};

// функция отправки сообщения
function sendBotMessage(bot, text) {
  io.emit("chat-message", {
    nick: bot.nick,
    color: bot.color,
    text
  });
}

/* -------------------- Вход ботов в чат -------------------- */
setTimeout(() => { io.emit("system", `${valera.nick} вошёл в чат`); valera.joined = true; }, 1000);
setTimeout(() => { io.emit("system", `${kisa.nick} вошёл в чат`); kisa.joined = true; }, 1000);

/* -------------------- Валера действия -------------------- */
setInterval(() => {
  if (!valera.joined) return;
  sendBotMessage(valera, random(valeraRandomPhrases));
}, 20000 + Math.random() * 25000);

setInterval(() => {
  if (!valera.joined) return;
  const clients = Array.from(io.sockets.sockets.values())
    .filter(s => s.nickname && s.nickname !== valera.nick && s.nickname !== kisa.nick);

  if (clients.length === 0) return;

  const target = random(clients);
  const action = Math.random() < 0.5 ? random(valeraCompliments) : random(valeraTrolls);

  sendBotMessage(valera, `@${target.nickname}, ${action}`);
}, 30000 + Math.random() * 30000);

/* -------------------- Валера <-> Киса -------------------- */
setInterval(() => {
  if (!valera.joined || !kisa.joined) return;
  // Валера флиртует с Кисой 50% вероятности
  if (Math.random() < 0.5) {
    sendBotMessage(valera, `@${kisa.nick}, ${random(valeraCompliments)}`);
  }
  // Киса отвечает Валере
  if (Math.random() < 0.5) {
    sendBotMessage(kisa, `@${valera.nick}, ${random(kisa.phrases)}`);
  }
}, 60000 + Math.random() * 30000);

/* -------------------- Киса действия с пользователями -------------------- */
setInterval(() => {
  if (!kisa.joined) return;
  const clients = Array.from(io.sockets.sockets.values())
    .filter(s => s.nickname && s.nickname !== kisa.nick);

  if (clients.length === 0) return;

  const target = random(clients);
  sendBotMessage(kisa, `@${target.nickname}, ${random(kisa.phrases)}`);
}, 15000 + Math.random() * 15000);

/* ===================== SOCKET.IO ===================== */
io.on("connection", (socket) => {
  // установка ника пользователя
  socket.on("set-nickname", (nick) => {
    socket.nickname = nick;
    socket.color = getRandomColor();
    io.emit("system", `${nick} вошёл в чат`);

    // Киса приветствует нового пользователя через @
    if (kisa.joined) {
      setTimeout(() => {
        sendBotMessage(kisa, `@${nick}, привет!`);
      }, 500);
    }
  });

  // обработка сообщений
  socket.on("chat-message", (msgText) => {
    const fromNick = socket.nickname || "Гость";

    // ретрансляция сообщения всем
    io.emit("chat-message", {
      nick: fromNick,
      color: socket.color || "#ffffff",
      text: msgText
    });
  });
});

/* -------------------- запуск сервера -------------------- */
server.listen(PORT, () => {
  console.log(`BubbleChat запущен на порту ${PORT}`);
});
