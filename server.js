import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFile } from "fs/promises";

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// отдаём index.html
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

// Боты
const BOT_VALERA = { name: "Валера", color: "#ffa500" };
const BOT_KISA   = { name: "Киса", color: "#ff66cc" };

// фразы Валеры
const valeraReplies = [
    "че бля", "а чё происходит?", "я тут", "я не понял...", "кто меня звал?", "шо надо?",
    "я занят был вообще-то", "кто в чате?", "а вы нормальные?", "че сидим?", "я ща приду...",
    "не зови меня просто так", "да-да, я тут", "чел ты...", "я думал я один", "че делаете?",
    "я считаю что вы странные", "мдааа...", "ладно, я пришел"
];

// фразы Кисы
const kisaReplies = [
    "я тут…", "мяу… рядом с вами", "что такое?", "я здесь", "а вы милые",
    "мне приятно тут быть", "как у вас дела?", "мне так уютно с вами", "я слушаю…"
];

// отправка сообщения от бота
function sendBot(nick, color, text) {
    io.emit("chat-message", { nick, color, text });
}

// сокеты
io.on("connection", socket => {
    socket.on("set-nickname", nick => {
        socket.nickname = nick;
        socket.color = getRandomColor();
        io.emit("system", ${nick} вошёл в чат);

        // Киса приветствует
        setTimeout(() => {
            const msg = kisaReplies[Math.floor(Math.random() * kisaReplies.length)];
            sendBot(BOT_KISA.name, BOT_KISA.color, msg);
        }, 1000);
    });

    socket.on("chat-message", msg => {
        io.emit("chat-message", { nick: socket.nickname, color: socket.color, text: msg });
    });
});

// Валера пишет каждые 5 секунд
setInterval(() => {
    const msg = valeraReplies[Math.floor(Math.random() * valeraReplies.length)];
    sendBot(BOT_VALERA.name, BOT_VALERA.color, msg);
}, 5000);

// запуск сервера
server.listen(PORT, () => console.log(BubbleChat запущен на порту ${PORT}));