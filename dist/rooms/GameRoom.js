"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const colyseus_1 = require("colyseus");
const GameRoomState_1 = require("./schema/GameRoomState");
const PlatformerLogic_1 = require("../logic/PlatformerLogic");
class GameRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 16;
        this.quizId = "";
        this.roundNumber = "";
    }
    onCreate(options) {
        this.setState(new GameRoomState_1.GameRoomState());
        if (options.customRoomId) {
            const parts = options.customRoomId.split("_");
            if (parts.length >= 4) {
                this.quizId = parts[1];
                this.roundNumber = parts[3];
            }
        }
        else {
            this.quizId = options.quizId || "unknown";
            this.roundNumber = options.roundNumber || "unknown";
        }
        if (this.quizId && this.roundNumber) {
            this.roomId = `quiz_${this.quizId}_round_${this.roundNumber}`;
        }
        // Khởi tạo logic game (mặc định Platformer)
        this.gameLogic = new PlatformerLogic_1.PlatformerLogic();
        this.gameLogic.initialize(this);
        // Expose InteractiveObjectManager từ logic (được khởi tạo trong logic)
        // @ts-ignore
        this.interactiveObjectManager = this.interactiveObjectManager;
        // Chuyển tiếp toàn bộ tin nhắn tới lớp logic
        this.onMessage("*", (client, type, message) => {
            this.gameLogic.handleMessage(client, type, message);
        });
    }
    onJoin(client, options) {
        this.gameLogic.onPlayerJoin(client, options);
    }
    onLeave(client, consented) {
        this.gameLogic.onPlayerLeave(client, consented);
    }
    onDispose() {
        this.gameLogic.cleanup();
    }
    sendKnockbackToClient(sessionId, forceX, forceY) {
        const targetClient = this.clients.find((c) => c.sessionId === sessionId);
        if (targetClient) {
            targetClient.send("applyKnockback", { forceX, forceY });
        }
    }
}
exports.GameRoom = GameRoom;
