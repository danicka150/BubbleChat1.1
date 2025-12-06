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
  const colors = ["#ff4040", "#40ff40", "#4040ff", "#ff80ff", "#ffff40", "#40ffff"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ===================== ВАЛЕРА-БОТ ===================== */
const valera = {
  nick: "Валера",
  color: "#ffaa00",
  joined: false
};

// список случайных фраз, которые Валера швыряет сам
const valeraRandomPhrases = [
  "Кто вообще тут?",
  "Чё молчим?",
  "Я тут сижу, если что.",
  "Аууу, люди?",
  "Ща бы пожрать…",
  "Кто-то вообще умеет писать?",
  "Где создатель-долбоёб?",
  "Эх… скучно.",
  "Чат умер?",
  "Пойду в окно посмотрю. Шутка, я бот."
];

// функция отправки сообщения Валеры
function valeraSend(text) {
  io.emit("chat-message", {
    nick: valera.nick,
    color: valera.color,
    text
  });
}

// Валера заходит в чат через 1 секунду
setTimeout(() => {
  io.emit("system", `${valera.nick} вошёл в чат`);
  valera.joined = true;
}, 1000);

// Валера сам пишет рандомные фразы каждые 20–45 секунд
setInterval(() => {
  if (!valera.joined) return;
  valeraSend(random(valeraRandomPhrases));
}, 20000 + Math.random() * 25000);

// функция логики ответов Валеры
function valeraLogic(text) {
  if (!text) return "че бля";

  const t = text.toLowerCase();

  // ключевые ответы
  if (t.includes("привет") || t.includes("здрав")) return "привет";
  if (t.includes("как дела")) return "нормально";
  if (t.includes("погода")) return "да какая-никакая";
  if (t.includes("фильм") || t.includes("фильмы")) return "нормальные фильмы";
  if (t.includes("что умеешь")) return "ничего, я тупой бот";
  if (t.includes("делал сегодня")) return "да мне насрать";
  if (t.includes("пока") || t.includes("увид")) return "пока";

  // тролль-ответ с шансом 10%
  if (Math.random() < 0.1) {
    return random([
      "че бля",
      "мда...",
      "ты это серьёзно?",
      "лучше бы молчал"
    ]);
  }

  // дефолт
  return "че бля";
}

/* ===================== SOCKET.IO ===================== */
io.on("connection", (socket) => {
  // Установка ника
  socket.on("set-nickname", (nick) => {
    socket.nickname = nick;
    socket.color = getRandomColor();
    io.emit("system", `${nick} вошёл в чат`);
  });

  // Когда клиент отправляет сообщение
  socket.on("chat-message", (msgText) => {
    const fromNick = socket.nickname || "Гость";

    // ретрансляция клиентам
    io.emit("chat-message", {
      nick: fromNick,
      color: socket.color || "#ffffff",
      text: msgText
    });

    // Валера отвечает
    if (socket.nickname && valera.joined) {
      const response = valeraLogic(msgText);

      setTimeout(() => {
        valeraSend(response);
      }, 500 + Math.random() * 1200); // задержка
    }
  });
});

/* -------------------- запуск сервера -------------------- */
server.listen(PORT, () => {
  console.log(`BubbleChat запущен на порту ${PORT}`);
});
