// server.js — полный, готовый к запуску (ES modules)
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

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ===================== ВАЛЕРА-БОТ ===================== */
/* Валера отвечает с упоминанием @ник, троллит и иногда пишет сам */

const valera = {
  nick: "ВалераБот",
  color: "#ffaa00", // фиксированный цвет для узнаваемости
  joined: false
};

// фразы-ответы по ключевым словам (с упоминанием автора)
function valeraLogic(text, fromNick) {
  const t = (text || "").toLowerCase();

  if (t.includes("привет") || t.includes("здрав")) {
    return random([
      `@${fromNick}, привет! Рад тебя видеть!`,
      `@${fromNick}, о, снова ты? Ну привет.`,
      `@${fromNick}, здарова, чё пришёл? :)`
    ]);
  }

  if (t.includes("как дела")) {
    return random([
      `@${fromNick}, отлично! :)`,
      `@${fromNick}, бывало и лучше...`,
      `@${fromNick}, ничего, живём.`
    ]);
  }

  if (t.includes("погода")) {
    return random([
      `@${fromNick}, посмотри в окно, я тупой бот.`,
      `@${fromNick}, мокрая или сухая.`
    ]);
  }

  if (t.includes("фильм") || t.includes("фильмы")) {
    return `@${fromNick}, нормальные фильмы.`;
  }

  if (t.includes("что умеешь")) {
    return `@${fromNick}, нечего, я тупой ботяра, потому что создатель иногда тупит.`;
  }

  if (t.includes("делал сегодня")) {
    return random([
      `@${fromNick}, да мне насрать.`,
      `@${fromNick}, лучше молчи.`,
      `@${fromNick}, не грузите меня своей фигнёй.`
    ]);
  }

  if (t.includes("пока") || t.includes("увид")) {
    return random([
      `@${fromNick}, ну и катай колобком.`,
      `@${fromNick}, пока!`
    ]);
  }

  // небольшой тролль-ответ с 10% шансом
  if (Math.random() < 0.10) {
    return random([
      `@${fromNick}, ты это серьёзно сейчас написал?`,
      `@${fromNick}, ну ты и клоун конечно...`,
      `@${fromNick}, лучше бы молчал.`,
      `@${fromNick}, мда…`,
      `@${fromNick}, не позорься ты так.`,
      `@${fromNick}, я IQ теряю, читая тебя.`
    ]);
  }

  // дефолтный ответ (если не совпало)
  return `@${fromNick}, создатель не добавил ответ на это.`;
}

// случайные фразы Валеры, которые он швыряет сам
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

// функция отправки сообщения Валеры в чат
function valeraSend(text) {
  io.emit("chat-message", {
    nick: valera.nick,
    color: valera.color,
    text
  });
}

/* Валера заходит в чат спустя 1 секунду после старта сервера */
setTimeout(() => {
  io.emit("system", `${valera.nick} вошёл в чат`);
  valera.joined = true;
}, 1000);

/* Валера сам пишет фразы каждые 20–45 секунд (рандомный интервал) */
setInterval(() => {
  if (!valera.joined) return;
  valeraSend(random(valeraRandomPhrases));
}, 20000 + Math.random() * 25000);

/* ===================== SOCKET.IO ===================== */

io.on("connection", (socket) => {
  // При установленном никнейме от клиента
  socket.on("set-nickname", (nick) => {
    // сохраняем ник для сокета и даём цвет
    socket.nickname = nick;
    socket.color = getRandomColor();

    // оповещаем всех
    io.emit("system", `${nick} вошёл в чат`);
  });

  // Когда клиент отправляет чат-сообщение
  socket.on("chat-message", (msgText) => {
    // если у сокета нет ника — игнорируем
    const fromNick = socket.nickname || "Гость";

    // ретранслируем сообщение всем клиентам (включая отправителя)
    io.emit("chat-message", {
      nick: fromNick,
      color: socket.color || "#ffffff",
      text: msgText
    });

    // Валера отвечает только на сообщения реальных пользователей (socket.nickname должен быть задан)
    if (socket.nickname && valera.joined) {
      // получаем ответ Валеры (включает упоминание @ник)
      const response = valeraLogic(msgText, socket.nickname);

      // небольшая задержка перед ответом, имитируем набор
      setTimeout(() => {
        valeraSend(response);
      }, 500 + Math.random() * 1200);
    }
  });
});

/* -------------------- запускаем сервер -------------------- */
server.listen(PORT, () => {
  console.log(`BubbleChat запущен на порту ${PORT}`);
});
