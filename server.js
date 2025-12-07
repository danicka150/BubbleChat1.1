const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// статика (index.html и т.п.)
app.use(express.static(path.join(__dirname)));

// список подключённых пользователей
let users = {};

io.on("connection", (socket) => {
    console.log("Новый пользователь:", socket.id);

    // пользователь заходит
    socket.on("setName", (name) => {
        users[socket.id] = {
            name: name,
            color: getRandomColor()
        };

        io.emit("userList", Object.values(users));
        io.emit("chatMessage", {
            name: "Система",
            color: "gray",
            message: `${name} зашел в чат`
        });
    });

    // обычное сообщение
    socket.on("chatMessage", (msg) => {
        const user = users[socket.id];
        if (!user) return;

        io.emit("chatMessage", {
            name: user.name,
            color: user.color,
            message: msg
        });
    });

    // отключение
    socket.on("disconnect", () => {
        if (users[socket.id]) {
            io.emit("chatMessage", {
                name: "Система",
                color: "gray",
                message: `${users[socket.id].name} вышел`
            });
            delete users[socket.id];
            io.emit("userList", Object.values(users));
        }
    });
});

// случайный цвет для обычных пользователей
function getRandomColor() {
    const colors = [
        "#ff4444", "#44ff44", "#4488ff",
        "#ffaa00", "#ff00ff", "#00ffaa",
        "#cccc00", "#ff6699"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log("Сервер запущен на порту", PORT);
});
