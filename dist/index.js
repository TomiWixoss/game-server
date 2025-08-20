"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const colyseus_1 = require("colyseus");
const monitor_1 = require("@colyseus/monitor");
const GameRoom_1 = require("./rooms/GameRoom");
const port = Number(process.env.PORT || 2567);
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
const gameServer = new colyseus_1.Server({ server });
// Sử dụng một room type duy nhất, quizId và roundNumber sẽ được truyền qua options
gameServer.define("game_room", GameRoom_1.GameRoom).filterBy(["customRoomId"]); // <-- Đổi tên thành customRoomId
app.use("/colyseus", (0, monitor_1.monitor)());
gameServer.listen(port);
console.log(`🚀 Server listening on ws://localhost:${port}`);
