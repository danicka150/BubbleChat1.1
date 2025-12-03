const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

// Создаём HTTP сервер — Render требует один сервер на всё
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, "index.html");

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end("Ошибка сервера");
            return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
    });
});

// WebSocket сервер
const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
    ws.on("message", msg => {
        // Рассылаем всем
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg.toString());
            }
        });
    });
});

server.listen(PORT, () => {
    console.log("BubbleChat running on port " + PORT);
});
