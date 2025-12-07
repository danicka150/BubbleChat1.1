import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFile } from "fs/promises";

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// index.html отдача
app.get("/", async (req, res) => {
    try {
        const data = await readFile("index.html");
        res.setHeader("Content-Type", "text/html");
        res.send(data);
    } catch (err) {
        res.status(500).send("Ошибка сервера");
    }
});

// случайный цвет ника
function getRandomColor() {
    const colors = ["#ff4040", "#40ff40", "#4080ff", "#ff80ff", "#ffff40", "#40ffff", "#ffa040"];
    return colors[Math.floor(Math.random() * colors.length)];
}

// --- БОТЫ -------------------------------------------------

const BOT_VALERA = { name: "Валера", color: "#ffa500" };
const BOT_KISA   = { name: "Киса", color: "#ff66cc" };

// Валера — основные фразы
const valeraReplies = [
    "че бля", "а чё происходит?", "я тут", "я не понял...", "кто меня звал?", "шо надо?",
    "я занят был вообще-то", "кто в чате?", "а вы нормальные?", "че сидим?", "я ща приду...",
    "не зови меня просто так", "да-да, я тут", "чел ты...", "я думал я один", "че делаете?",
    "я считаю что вы странные", "мдааа...", "ладно, я пришел", "чё за шум?", "это кто тут?",
    "давайте базарить!", "я тут сижу и думаю...", "кому что сказать?", "я щас вас всех слушаю",
    "мне интересно кто тут самый шумный", "я бы сказал пару слов", "что происходит, люди?", 
    "кто со мной?", "мне скучно, давайте общаться!"
];

// Валера злится на оскорбления/маты
const valeraAngry = [
    "сам такой", "тебе ебать что ли?", "не груби мне", "слышь ты, полегче",
    "ты че охуел?", "ща дам в табло", "ага, очень смешно", "рот закрой",
    "чел, ты реально даун?", "сам с собой разговариваешь?", "я тебе щас дам", "щёлкну по лбу щас",
    "не пиши мне так", "я тебя ща научу!", "отстань от меня!"
];

// Валера флиртует с Кисой
const valeraFlirt = [
    "киса... где ты?", "киса, мне скучно без тебя", "киса, я думаю о тебе",
    "киса, ты самая красивая тут", "киса, пойдем в дм?", "киса, ну ответь мне...", "кисааааа…",
    "мне нравится твоя улыбка, кисонька", "ты такая милая, кисуля"
];

// Валера ревнует
const valeraJealous = [
    "эй, кто это с Кисой?", "не смей её трогать!", "киса, это кто?!", "я ревную...",
    "подожди, это кто?", "не смей, я слежу!"
];

// Киса обычные реплики
const kisaReplies = [
    "я тут…", "мяу… рядом с вами", "что такое?", "я здесь", "а вы милые",
    "мне приятно тут быть", "как у вас дела?", "мне так уютно с вами", "я слушаю…",
    "рассказывайте дальше", "вам нужна киса? я тут", "я просто наблюдаю", "мяу, тихо..."
];

// Киса отвечает Валере (заигрывает)
const kisaToValera = [
    "я здесь, Валера… мяу", "Валера, прекрати… я же смущаюсь",
    "Валера, ну чего тебе?", "Валера, иди сюда…", "мне нравится, когда ты зовёшь меня",
    "я только для тебя тут", "Валера, ты смешной", "я тебя слышу…", "мяу, Валера, я рядом"
];

// Киса приветствует новых пользователей
const kisaHello = [
    "мяу, привет!", "приветик…", "мяу, рада видеть!", "ой, кто-то пришёл~",
    "я тут, привет!", "ра-рада видеть…", "мяу, кто тут новенький?"
];

// Кулдауны ботов
let valeraCooldown = 0;
let kisaCooldown = 0;

// --- СОКЕТЫ -------------------------------------------------

io.on("connection", socket => {

    socket.on("set-nickname", nick => {
        socket.nickname = nick;
        socket.color = getRandomColor();
        io.emit("system", ${nick} вошёл в чат);

        // Киса приветствует
        if (Math.random() < 0.8) {
            setTimeout(() => {
                const msg = kisaHello[Math.floor(Math.random() * kisaHello.length)];
                sendBot(BOT_KISA.name, BOT_KISA.color, msg);
            }, 800);
        }
    });

    socket.on("chat-message", msg => {

        io.emit("chat-message", { nick: socket.nickname, color: socket.color, text: msg });
const lower = msg.toLowerCase();
        const mentionedValera = lower.includes("@валера");
        const mentionedKisa = lower.includes("@киса");

        // Валера отвечает, если его упомянули
        if (mentionedValera) {
            let reply = valeraReplies[Math.floor(Math.random() * valeraReplies.length)];

            const rude = ["сука", "хуй", "пид", "долб", "еба"];
            if (rude.some(w => lower.includes(w))) {
                reply = valeraAngry[Math.floor(Math.random() * valeraAngry.length)];
            }

            setTimeout(() => sendBot(BOT_VALERA.name, BOT_VALERA.color, reply), 300);
        }

        // Валера ревнует Кису
        if (!mentionedValera && lower.includes("@киса") && Math.random() < 0.7 && valeraCooldown <= Date.now()) {
            valeraCooldown = Date.now() + 2000;
            const r = valeraJealous[Math.floor(Math.random() * valeraJealous.length)];
            setTimeout(() => sendBot(BOT_VALERA.name, BOT_VALERA.color, r), 400);
        }

        // Киса отвечает, если её упомянули
        if (mentionedKisa) {
            const reply = kisaReplies[Math.floor(Math.random() * kisaReplies.length)];
            setTimeout(() => sendBot(BOT_KISA.name, BOT_KISA.color, reply), 250);
        }

        // Валера флиртует с Кисой
        if (Math.random() < 0.08 && valeraCooldown <= Date.now()) {
            valeraCooldown = Date.now() + 2000;
            const r = valeraFlirt[Math.floor(Math.random() * valeraFlirt.length)];
            setTimeout(() => sendBot(BOT_VALERA.name, BOT_VALERA.color, r), 400);
        }

        // Киса отвечает Валере
        if (lower.includes("валер") && Math.random() < 0.5) {
            const r = kisaToValera[Math.floor(Math.random() * kisaToValera.length)];
            setTimeout(() => sendBot(BOT_KISA.name, BOT_KISA.color, r), 300);
        }

        // Киса случайно пишет сама
        if (Math.random() < 0.05 && kisaCooldown <= Date.now()) {
            kisaCooldown = Date.now() + 2000;
            const r = kisaReplies[Math.floor(Math.random() * kisaReplies.length)];
            setTimeout(() => sendBot(BOT_KISA.name, BOT_KISA.color, r), 400);
        }

        // Валера пишет сам по рандому
        if (Math.random() < 0.06 && valeraCooldown <= Date.now()) {
            valeraCooldown = Date.now() + 1500;
            const r = valeraReplies[Math.floor(Math.random() * valeraReplies.length)];
            setTimeout(() => sendBot(BOT_VALERA.name, BOT_VALERA.color, r), 350);
        }

    });
});

// отправка сообщения бота
function sendBot(nick, color, text) {
    io.emit("chat-message", { nick, color, text });
}

server.listen(PORT, () => console.log("BubbleChat запущен на порту " + PORT));
