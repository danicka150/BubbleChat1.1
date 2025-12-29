import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFile } from "fs/promises";

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const users = new Map(); // nick -> socket.id

app.get("/", async (req, res) => {
  const data = await readFile("index.html");
  res.setHeader("Content-Type", "text/html");
  res.send(data);
});

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ===== БОТЫ ===== */
const valera = { nick: "Валера", color: "#ffaa00" };
const kisa   = { nick: "Киса",   color: "#ff69b4" };

/* ФРАЗЫ — ОСТАЮТСЯ ЖЁСТКИЕ */
const valeraRandomPhrases = [
  "че бля", "мда...", "вы серьёзно?", "лол",
  "ох уж эти люди", "мне насрать",
  "чат мёртв", "ну и движ",
  "что за бред", "2+2=5",
  "зима не лето, салат не котлета"
];

const valeraCompliments = [
  " @nick норм написал",
  "@nick в этот раз не тупо",
  " @nick удивил",
  
  "@nick ну хоть кто-то адекватный"
];

const valeraTrolls = [
  "@nick ты вообще думаешь?",
  "мда, @nick",
  "@nick сильно, конечно",
  "@nick IQ где потерял?"
];

const kisaPhrases = [
  "@nick ммм 😏",
  "@nick ты милый",
  "@nick интересно читать",
  "@nick хех",
  "@nick мне нравится как ты пишешь",
  "@nick я тут читаю 👀"
];

function sendBot(bot, text) {
  io.emit("chat-message", {
    nick: bot.nick,
    color: bot.color,
    text
  });
}

/* ===== SOCKET ===== */
io.on("connection", (socket) => {

  /* Ник ОБЯЗАТЕЛЕН */
  socket.on("set-nickname", (nick) => {
    if (!nick) return;
    socket.nickname = nick;
    users.set(nick, socket.id);
    io.emit("system", `${nick} вошёл`);
  });

  socket.on("chat-message", (text) => {
    if (!socket.nickname) return;

    io.emit("chat-message", {
      nick: socket.nickname,
      color: "#ffffff",
      text
    });

    /* ===== Валера ===== */
    if (Math.random() < 0.7) {
      let resp;

      if (Math.random() < 0.2) {
        resp = `@${socket.nickname} ${random(valeraTrolls).replace("@nick", socket.nickname)}`;
      } else if (Math.random() < 0.15) {
        resp = `@${socket.nickname} ${random(valeraCompliments)}`;
      } else {
        resp = random(valeraRandomPhrases);
      }

      setTimeout(() => sendBot(valera, resp), 700);
    }

    /* ===== Киса ===== */
    if (Math.random() < 0.8) {
      setTimeout(() => {
        sendBot(kisa, random(kisaPhrases));
      }, 1000);
    }
  });

  /* ===== ЛИЧНЫЕ СООБЩЕНИЯ ===== */
  socket.on("private-message", ({ to, text }) => {
    const targetId = users.get(to);
    if (!targetId) return;

    io.to(targetId).emit("private-message", {
      from: socket.nickname,
      text
    });
  });

  socket.on("disconnect", () => {
    if (socket.nickname) {
      users.delete(socket.nickname);
      io.emit("system", `${socket.nickname} вышел`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`BubbleChat запущен на порту ${PORT}`);
});import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFile } from "fs/promises";

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const users = new Map(); // nick -> socket.id

app.get("/", async (req, res) => {
  const data = await readFile("index.html");
  res.setHeader("Content-Type", "text/html");
  res.send(data);
});

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ===== БОТЫ ===== */
const valera = { nick: "Валера", color: "#ffaa00" };
const kisa   = { nick: "Киса",   color: "#ff69b4" };

/* ФРАЗЫ — ОСТАЮТСЯ ЖЁСТКИЕ */
const valeraRandomPhrases = [
  "че бля", "мда...", "вы серьёзно?", "лол",
  "ох уж эти люди", "мне насрать",
  "чат мёртв", "ну и движ",
  "что за бред", "2+2=5",
  "зима не лето, салат не котлета"
];

const valeraCompliments = [
  " @nick норм написал",
  "@nick в этот раз не тупо",
  " @nick удивил",
  
  "@nick ну хоть кто-то адекватный"
];

const valeraTrolls = [
  "@nick ты вообще думаешь?",
  "мда, @nick",
  "@nick сильно, конечно",
  "@nick IQ где потерял?"
];

const kisaPhrases = [
  "@nick ммм 😏",
  "@nick ты милый",
  "@nick интересно читать",
  "@nick хех",
  "@nick мне нравится как ты пишешь",
  "@nick я тут читаю 👀"
];

function sendBot(bot, text) {
  io.emit("chat-message", {
    nick: bot.nick,
    color: bot.color,
    text
  });
}

/* ===== SOCKET ===== */
io.on("connection", (socket) => {

  /* Ник ОБЯЗАТЕЛЕН */
  socket.on("set-nickname", (nick) => {
    if (!nick) return;
    socket.nickname = nick;
    users.set(nick, socket.id);
    io.emit("system", `${nick} вошёл`);
  });

  socket.on("chat-message", (text) => {
    if (!socket.nickname) return;

    io.emit("chat-message", {
      nick: socket.nickname,
      color: "#ffffff",
      text
    });

    /* ===== Валера ===== */
    if (Math.random() < 0.7) {
      let resp;

      if (Math.random() < 0.2) {
        resp = `@${socket.nickname} ${random(valeraTrolls).replace("@nick", socket.nickname)}`;
      } else if (Math.random() < 0.15) {
        resp = `@${socket.nickname} ${random(valeraCompliments)}`;
      } else {
        resp = random(valeraRandomPhrases);
      }

      setTimeout(() => sendBot(valera, resp), 700);
    }

    /* ===== Киса ===== */
    if (Math.random() < 0.8) {
      setTimeout(() => {
        sendBot(kisa, random(kisaPhrases));
      }, 1000);
    }
  });

  /* ===== ЛИЧНЫЕ СООБЩЕНИЯ ===== */
  socket.on("private-message", ({ to, text }) => {
    const targetId = users.get(to);
    if (!targetId) return;

    io.to(targetId).emit("private-message", {
      from: socket.nickname,
      text
    });
  });

  socket.on("disconnect", () => {
    if (socket.nickname) {
      users.delete(socket.nickname);
      io.emit("system", `${socket.nickname} вышел`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`BubbleChat запущен на порту ${PORT}`);
});

