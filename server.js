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

const valeraReplies = [
    "че бля","а чё происходит?","я тут","я не понял...","кто меня звал?","шо надо?",
    "я занят был вообще-то","кто в чате?","а вы нормальные?","че сидим?","я ща приду...",
    "не зови меня просто так","да-да, я тут","чел ты...","я думал я один","че делаете?",
    "я считаю что вы странные","мдааа...","ладно, я пришел"
];

const valeraAngry = [
    "сам такой","тебе ебать что ли?","не груби мне","слышь ты, полегче","ты че охуел?",
    "ща дам в табло","ага, очень смешно","рот закрой","чел, ты реально даун?",
    "сам с собой разговариваешь?","я тебе щас дам","щёлкну по лбу щас"
];

const valeraFlirt = [
    "киса... где ты?","киса, мне скучно без тебя","киса, я думаю о тебе",
    "киса, ты самая красивая тут","киса, пойдем в дм?","киса, ну ответь мне...","кисааааа…"
];

const kisaReplies = ["я тут…","мяу… рядом с вами","что такое?"];
const kisaToValera = [
    "я здесь, Валера… мяу","Валера, прекрати… я же смущаюсь","Валера, ну чего тебе?",
    "Валера, иди сюда…","мне нравится, когда ты зовёшь меня","я только для тебя тут","я тебя слышу…"
];
const kisaHello = ["мяу, привет!","приветик…","мяу, рада видеть!","ой, кто-то пришёл~","я тут, привет!","ра-рада видеть…"];

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
            }, 1000); // уменьшена задержка
        }
    });

    socket.on("chat-message", msg => {
        io.emit("chat-message", { nick: socket.nickname, color: socket.color, text: msg });

        const lower = msg.toLowerCase();
        const mentionedValera = lower.includes("@валера");
        const mentionedKisa = lower.includes("@киса");

        // Валера отвечает если его упомянули
        if (mentionedValera && valeraCooldown <= Date.now()) {
            valeraCooldown = Date.now() + 2000; // каждые 2 секунды максимум
            const reply = valeraReplies[Math.floor(Math.random() * valeraReplies.length)];
            setTimeout(() => sendBot("Валера", "#66aaff", reply), 500); // быстрее
        }

        // Киса отвечает если её упомянули
        if (mentionedKisa && kisaCooldown <= Date.now()) {
            kisaCooldown = Date.now() + 2000;
            const reply = kisaReplies[Math.floor(Math.random() * kisaReplies.length)];
            setTimeout(() => sendBot("Киса", "#ff66cc", reply), 500);
        }

        // Валера флиртует с Кисой
        if (Math.random() < 0.1 && valeraCooldown <= Date.now()) { // чаще
            valeraCooldown = Date.now() + 2000;
            const r = valeraFlirt[Math.floor(Math.random() * valeraFlirt.length)];
            setTimeout(() => sendBot("Валера", "#66aaff", r), 500);
        }

        // Киса отвечает Валере
        if (lower.includes("валер") && Math.random() < 0.5 && kisaCooldown <= Date.now()) {
            kisaCooldown = Date.now() + 2000;
            const r = kisaToValera[Math.floor(Math.random() * kisaToValera.length)];
            setTimeout(() => sendBot("Киса", "#ff66cc", r), 500);
        }

        // Киса иногда пишет сама
        if (Math.random() < 0.05 && kisaCooldown <= Date.now()) { // чуть чаще
            kisaCooldown = Date.now() + 2000;
            const r = kisaReplies[Math.floor(Math.random() * kisaReplies.length)];
            setTimeout(() => sendBot("Киса", "#ff66cc", r), 500);
        }
    });
});

// отправка от имени бота
function sendBot(nick, color, text) {
    io.emit("chat-message", { nick, color, text });
}

server.listen(PORT, () => console.log("BubbleChat запущен на порту " + PORT));

