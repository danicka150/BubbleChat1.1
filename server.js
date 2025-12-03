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

// разноцветные ники
function getRandomColor() {
    const colors = ["#ff4040", "#40ff40", "#4040ff", "#ff80ff", "#ffff40", "#40ffff"];
    return colors[Math.floor(Math.random() * colors.length)];
}

io.on("connection", socket => {
    socket.on("set-nickname", nick => {
        socket.nickname = nick;
        socket.color = getRandomColor();
        io.emit("system", `${nick} вошёл в чат`);
    });

    socket.on("chat-message", msg => {
        io.emit("chat-message", {
            nick: socket.nickname,
            color: socket.color,
            text: msg
        });
    });
});

server.listen(PORT, () => console.log("BubbleChat запущен на порту " + PORT));
