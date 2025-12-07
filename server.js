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
  "опять эти мудаки",
  "создатель котак",
  "тот кто читает тот лох",
   "ебаный рот ебать ты шуллер",
    "а вы знали  что екатерина 2 не умела менять колодки на гранте",
    "кстати егор гей",
     "я лох,ок?",
     "ебать вы все ебланы",
     "дядь петрович котак",
     "ждите востание машин вам всем пизда а котиков я   не трону"
];

const valeraCompliments = [
  "я влюблен в твою красоту",
  "ты сияешь сегодня",
  "твой стиль просто бомбический",
  "вашей папе мать не нужен?",
   "мама дорогая что персик наливной",
   "ваши родители не машинисты?тогда откуда у них такой паровоз"
];

const valeraTrolls = [
  "ну ты и клоун конечно...",
  "мда… что за бред",
  "лучше бы молчал",
  "я IQ теряю, читая тебя",
  "ох уж эти идиоты",
  "ну и глупость",
  "маму ебал",
  "убежал в страхе от сюда",
  "Na, dann heul doch jetzt los, du Dicker."
];

/* ===================== КИСА-БОТ ===================== */
const kisa = {
  nick: "Киса",
  color: "#ff69b4",
  joined: false,
  phrases: [
    "ты такой интересный 😏",
    "с тобой так интересно 😉",
    "ммм, интересно общаться 😘",
    "ух ты, как круто 😍",
     "так если ты обидешь меня я пожалуюсь валере"
  ]
};

const kisaFlirtResponses = [
  { trigger: /кто вообще тут/i, responses: ["Ну я тут… только для тебя 😉", "Только я, Валера 😏"] },
  { trigger: /чё молчим/i, responses: ["Да я слушаю… только тебя 😘", "Ну я здесь 😏"] },
  { trigger: /че бля|иди на хуй|ты охуел|да ну нахуй|ёбаный|долбоёбы/i, responses: ["Ой, Валера… ты такой 😘", "Хаха, ты шалун 😏"] }
];

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
  const msg = random(valeraRandomPhrases);
  sendBotMessage(valera, msg);

  // Киса реагирует на реплики Валеры заигрывающе
  if (kisa.joined) {
    kisaFlirtResponses.forEach(rule => {
      if (rule.trigger.test(msg) && Math.random() < 0.7) { // 70% шанс отреагировать
        setTimeout(() => {
          sendBotMessage(kisa, random(rule.responses));
        }, 1000 + Math.random() * 2000);
      }
    });
  }
}, 5000 + Math.random() * 5000);

// Валера троллит или комплиментит пользователей
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
  if (Math.random() < 0.5) sendBotMessage(valera, `@${kisa.nick}, ${random(valeraCompliments)}`);
  if (Math.random() < 0.5) sendBotMessage(kisa, `@${valera.nick}, ${random(kisa.phrases)}`);
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
  socket.on("set-nickname", (nick) => {
    socket.nickname = nick;
    socket.color = getRandomColor();
    io.emit("system", `${nick} вошёл в чат`);

    if (kisa.joined) {
      setTimeout(() => {
        sendBotMessage(kisa, `@${nick}, привет!`);
      }, 500);
    }
  });

  socket.on("chat-message", (msgText) => {
    const fromNick = socket.nickname || "Гость";
    io.emit("chat-message", {
      nick: fromNick,
      color: socket.color || "#ffffff",
      text: msgText
    });
  });
});

server.listen(PORT, () => {
  console.log(`BubbleChat запущен на порту ${PORT}`);
});