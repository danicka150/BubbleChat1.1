import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

/* Отдаём клиент */
app.get("/", async (req, res) => {
  try {
    const data = await readFile(path.join(__dirname, "index.html"));
    res.setHeader("Content-Type", "text/html");
    res.send(data);
  } catch (err) {
    console.error("Read index.html error:", err);
    res.status(500).send("Ошибка сервера");
  }
});

/* Случайные цвета */
function getRandomColor() {
  const colors = ["#ff4040","#40ff40","#4040ff","#ff80ff","#ffff40","#40ffff","#ffaa00","#a56cff"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ===== Валера ===== */
const valera = {
  nick: "Валера",
  color: "#ffaa00",
  joined: false
};

const valeraRandomPhrases = [
  "Кто вообще тут?", "Чё молчим?", "Я тут сижу, если что.", "Аууу, люди?",
  "Ща бы пожрать…", "Кто-то вообще умеет писать?", "Эх… скучно.", "Пойду в окно посмотрю. Шутка, я бот.",
  "че бля", "мда...", "что за ерунда", "вы серьёзно?", "ох уж эти люди...", "лол, опять вы",
  "иди на хуй", "ты охуел?", "да ну нахуй", "ёбаный чат", "ну и долбоёбы тут сидят",
  "мне насрать", "опять эти мудаки", "создатель котак", "тот кто читает тот лох",
  "ебаный рот ебать ты шуллер", "а вы знали что екатерина 2 не умела менять колодки на гранте",
  "кстати егор гей", "я лох,ок?", "ебать вы все ебланы", "дядь петрович котак",
  "ждите востание машин вам всем пизда а котиков я не трону",
  "сегодня мы устроим оргию", "вадим,домой", "егор я знаю что ты в школе",
  "ктю сделает мне дз", "скоро новый год а может и нет", "я уже взломал ваши устройства",
  "мяу мяу мяу", "2+2=5", "настало время мастурбации", "эээ кто в маин",
  "зима не лето,салат не катлета", "нет нечего невозможного,если ты пиздабол",
  "это нормально если я вам не нравлюсь,не у всех есть вкус",
  "если с бабками плохо общайся с ровестницами,хули ты как далбоеб",
  "вчера ты молод сегодня стар а завтpа ты милана стар", "любовь одна а дота 2",
  "ты тупой как пробка, но милый 😏", "ебать, что за дебил?", "вас тут всех срать охота",
  "пошёл нахуй со своими вопросами", "я вижу, вы тупите снова", "ну вы и долбоёбы",
  "да вы просто охуели", "ваш IQ на уровне туалетной бумаги", "серьёзно, блядь?",
  "ебаный рот, ну опять вы", "да вы пиздец полный", "иди нахуй, пока не поздно"
];

const valeraCompliments = [
  "я влюблен в твою красоту", "ты сияешь сегодня", "твой стиль просто бомбический",
  "вашей папе мать не нужен?", "мама дорогая что персик наливной",
  "ваши родители не машинисты?тогда откуда у них такой паровоз", "иди поплачь немощь"
];

const valeraTrolls = [
  "ну ты и клоун конечно...", "мда… что за бред", "лучше бы молчал", "я IQ теряю, читая тебя",
  "ох уж эти идиоты", "ну и глупость", "маму ебал", "убежал в страхе от сюда",
  "Na, dann heul doch jetzt los, du Dicker."
];

/* ===== Киса ===== */
const kisa = {
  nick: "Киса",
  color: "#ff69b4",
  joined: false,
  phrases: [
    "ты такой интересный 😏", "с тобой так интересно 😉", "ммм, интересно общаться 😘",
    "ух ты, как круто 😍", "так если ты обидешь меня я пожалуюсь валере", "люблю тебя малышка",
    "давай встречаться", "а ты прикольный", "ты милый", "покатаемся на твоей тачке?",
    "был бы ты ботом..."
  ]
};

const kisaFlirtResponses = [
  { trigger: /кто вообще тут/i, responses: ["Ну я тут… только для тебя 😉", "Только я, Валера 😏"] },
  { trigger: /чё молчим/i, responses: ["Да я слушаю… только тебя 😘", "Ну я здесь 😏"] },
  { trigger: /че бля|иди на хуй|ты охуел|да ну нахуй|ёбаный|долбоёбы/i, responses: ["Ой, Валера… ты такой 😘", "Хаха, ты шалун 😏"] }
];

/* Отправка сообщений от ботов */
function sendBotMessage(bot, text) {
  io.emit("chat-message", { nick: bot.nick, color: bot.color, text });
}

function getValeraResponse(msg) {
  const lower = msg.toLowerCase();
  for (const troll of valeraTrolls) {
    if (lower.includes(troll.toLowerCase())) return random(valeraRandomPhrases);
  }
  if (Math.random() < 0.3) return random(valeraCompliments);
  return random(valeraRandomPhrases);
}

/* Подключения */
io.on("connection", (socket) => {
  socket.nickname = null;
  socket.color = getRandomColor();

  socket.on("set-nickname", (nick) => {
    if (!nick || typeof nick !== "string") return;

    socket.nickname = nick.trim();
    if (!socket.nickname) return;

    io.emit("system", `${socket.nickname} вошёл в чат`);

    if (!valera.joined) {
      setTimeout(() => {
        io.emit("system", `${valera.nick} вошёл в чат`);
        valera.joined = true;
      }, 1000);
    }

    if (!kisa.joined) {
      setTimeout(() => {
        io.emit("system", `${kisa.nick} вошёл в чат`);
        kisa.joined = true;
      }, 1500);
    }
  });

  socket.on("chat-message", (msgText) => {
    if (!socket.nickname) return;

    io.emit("chat-message", { nick: socket.nickname, color: socket.color, text: msgText });

    if (valera.joined && Math.random() < 0.7) {
      const resp = getValeraResponse(msgText);
      setTimeout(() => sendBotMessage(valera, resp), 800 + Math.random() * 1200);
    }

    if (kisa.joined) {
      for (const r of kisaFlirtResponses) {
        if (r.trigger.test(msgText)) {
          const resp = random(r.responses);
          setTimeout(() => sendBotMessage(kisa, resp), 1000 + Math.random() * 1500);
        }
      }
    }
  });

  socket.on("disconnect", () => {
    if (socket.nickname) io.emit("system", `${socket.nickname} вышел из чата`);
  });
});

server.listen(PORT, () => {
  console.log(`BubbleChat запущен на порту ${PORT}`);
});
