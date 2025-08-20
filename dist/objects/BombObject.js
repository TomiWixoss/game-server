"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BombObject = void 0;
const GameRoomState_1 = require("../rooms/schema/GameRoomState");
class BombObject {
    constructor(id, room) {
        this.type = "bomb";
        this.LIFETIME_MS = 10000;
        this.EXPLOSION_RADIUS = 150;
        this.EXPLOSION_FORCE = 1800;
        this.id = id;
        this.room = room;
        this.networkState = new GameRoomState_1.Bomb();
    }
    spawn(x, y, options) {
        this.networkState.x = x;
        this.networkState.y = y;
        this.networkState.state = "ticking";
        this.room.state.bombs.set(this.id, this.networkState);
        const lifetime = typeof (options === null || options === void 0 ? void 0 : options.lifetimeMs) === "number"
            ? options.lifetimeMs
            : this.LIFETIME_MS;
        this.lifetimeTimer = this.room.clock.setTimeout(() => {
            this.explode();
        }, lifetime);
    }
    update(_deltaTime) { }
    despawn() {
        var _a;
        try {
            if ((_a = this.lifetimeTimer) === null || _a === void 0 ? void 0 : _a.clear)
                this.lifetimeTimer.clear();
        }
        catch (_b) { }
        try {
            this.room.state.bombs.delete(this.id);
        }
        catch (_c) { }
    }
    explode() {
        if (this.networkState.state === "exploding")
            return;
        this.networkState.state = "exploding";
        this.room.state.players.forEach((player, sessionId) => {
            const dx = player.x - this.networkState.x;
            const dy = player.y - this.networkState.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= this.EXPLOSION_RADIUS) {
                const angle = Math.atan2(dy, dx);
                const forceMagnitude = this.EXPLOSION_FORCE * (1 - distance / this.EXPLOSION_RADIUS);
                const forceX = Math.cos(angle) * forceMagnitude;
                const forceY = Math.sin(angle) * forceMagnitude;
                this.room.sendKnockbackToClient(sessionId, forceX, forceY);
            }
        });
        this.room.clock.setTimeout(() => {
            var _a;
            (_a = this.room.interactiveObjectManager) === null || _a === void 0 ? void 0 : _a.despawnObject(this);
        }, 500);
    }
}
exports.BombObject = BombObject;
