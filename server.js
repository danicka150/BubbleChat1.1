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

// Валера — нормальные фразы
const valeraReplies = [
    "че бля",
    "а чё происходит?",
    "я тут",
    "я не понял...",
    "кто меня звал?",
    "шо надо?",
    "я занят был вообще-то",
    "кто в чате?",
    "а вы нормальные?",
    "че сидим?",
    "я ща приду...",
    "не зови меня просто так",
    "да-да, я тут",
    "чел ты...",
    "я думал я один",
    "че делаете?",
    "я считаю что вы странные",
    "мдааа...",
    "ладно, я пришел"
];

// Валера — злится на оскорбления и мат
const valeraAngry = [
    "сам такой",
    "тебе ебать что ли?",
    "не груби мне",
    "слышь ты, полегче",
    "ты че охуел?",
    "ща дам в табло",
    "ага, очень смешно",
    "рот закрой",
    "чел, ты реально даун?",
    "сам с собой разговариваешь?",
    "я тебе щас дам",
    "щёлкну по лбу щас"
];

// Валера флиртует с Кисой
const valeraFlirt = [
    "киса... где ты?",
    "киса, мне скучно без тебя",
    "киса, я думаю о тебе",
    "киса, ты самая красивая тут",
    "киса, пойдем в дм?",
    "киса, ну ответь мне...",
    "кисааааа…"
];

// Киса — обычные реплики
const kisaReplies = [
    "я тут…",
    "мяу… рядом с вами",
    "что такое?",
    "я здесь",
    "а вы милые",
    "мне приятно тут быть",
    "как у вас дела?",
    "мне так уютно с вами",
    "я слушаю…",
    "рассказывайте дальше",
    "вам нужна киса? я тут"
];

// Киса — отвечает Валере (заигрывает)
const kisaToValera = [
    "я здесь, Валера… мяу",
    "Валера, прекрати… я же смущаюсь",
    "Валера, ну чего тебе?",
    "Валера, иди сюда…",
    "мне нравится, когда ты зовёшь меня",
    "я только для тебя тут",
    "Валера, ты смешной",
    "я тебя слышу…"
];

// Киса — приветствует людей
const kisaHello = [
    "мяу, привет!",
    "приветик…",
    "мяу, рада видеть!",
    "ой, кто-то пришёл~",
    "я тут, привет!",
    "ра-рада видеть…"
];

// Частота случайных сообщений
let valeraCooldown = 0;
let kisaCooldown = 0;

// --- СОКЕТЫ -------------------------------------------------

io.on("connection", socket => {
    socket.on("set-nickname", nick => {
        socket.nickname = nick;
        socket.color = getRandomColor();
        io.emit("system", `${nick} вошёл в чат`);

        // Киса приветствует
        if (Math.random() < 0.8) {
            setTimeout(() => {
                const msg = kisaHello[Math.floor(Math.random() * kisaHello.length)];
                sendBot("Киса", "#ff66cc", msg);
            }, 1500);
        }
    });

    // получение сообщения
    socket.on("chat-message", msg => {
        io.emit("chat-message", { nick: socket.nickname, color: socket.color, text: msg });

        const lower = msg.toLowerCase();

        const mentionedValera = lower.includes("@валера");
        const mentionedKisa = lower.includes("@киса");

        // --- Валера отвечает если его позвали
        if (mentionedValera) {
            let reply = valeraReplies[Math.floor(Math.random() * valeraReplies.length)];

            const rude = ["сука", "хуй", "пид", "долб", "еба"];
            if (rude.some(w => lower.includes(w))) {
                reply = valeraAngry[Math.floor(Math.random() * valeraAngry.length)];
            }

            setTimeout(() => sendBot("Валера", "#66aaff", reply), 800);
        }

        // --- Киса отвечает если её позвали
        if (mentionedKisa) {
            const reply = kisaReplies[Math.floor(Math.random() * kisaReplies.length)];
            setTimeout(() => sendBot("Киса", "#ff66cc", reply), 700);
        }

        // --- Валера иногда флиртует с Кисой
        if (Math.random() < 0.05 && valeraCooldown <= Date.now()) {
            valeraCooldown = Date.now() + 5000;
            const r = valeraFlirt[Math.floor(Math.random() * valeraFlirt.length)];
            setTimeout(() => sendBot("Валера", "#66aaff", r), 1000);
        }

        // --- Киса отвечает Валере
        if (lower.includes("валер") && Math.random() < 0.4) {
            const r = kisaToValera[Math.floor(Math.random() * kisaToValera.length)];
            setTimeout(() => sendBot("Киса", "#ff66cc", r), 1200);
        }

        // --- Киса иногда пишет сама
        if (Math.random() < 0.03 && kisaCooldown <= Date.now()) {
            kisaCooldown = Date.now() + 6000;
            const r = kisaReplies[Math.floor(Math.random() * kisaReplies.length)];
            setTimeout(() => sendBot("Киса", "#ff66cc", r), 1500);
        }
    });
});

// отправка от имени бота
function sendBot(nick, color, text) {
    io.emit("chat-message", { nick, color, text });
}

server.listen(PORT, () => console.log("BubbleChat запущен на порту " + PORT));
