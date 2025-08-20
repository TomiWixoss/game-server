"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformerLogic = void 0;
const GameRoomState_1 = require("../rooms/schema/GameRoomState");
const InteractiveObjectManager_1 = require("../managers/InteractiveObjectManager");
/**
 * Lớp chứa toàn bộ logic cho chế độ chơi Platformer.
 */
class PlatformerLogic {
    constructor() {
        this.DISAPPEAR_DELAY = 1500;
        this.REAPPEAR_DELAY = 1500;
        this.GRAB_DISTANCE_THRESHOLD = 80;
        this.ESCAPE_STRUGGLE_INCREMENT = 25;
        this.SPRING_ANIMATION_DURATION = 250;
        this.MIN_WIND_CHANGE_TIME = 3000;
        this.MAX_WIND_CHANGE_TIME = 8000;
        this.bombSpawners = new Map();
    }
    initialize(room) {
        this.room = room;
        // InteractiveObjectManager hiện nhận GameRoom cụ thể, ép kiểu an toàn ở runtime
        this.interactiveObjectManager = new InteractiveObjectManager_1.InteractiveObjectManager(this.room);
        // Gắn vào room để các InteractiveObject có thể truy cập như trước (compat layer)
        this.room.interactiveObjectManager = this.interactiveObjectManager;
        this.changeWindDirection();
        this.scheduleNextWindChange();
        this.room.setSimulationInterval((deltaTime) => this.update(deltaTime));
    }
    update(deltaTime) {
        this.interactiveObjectManager.update(deltaTime);
    }
    onPlayerJoin(client, options) {
        const player = new GameRoomState_1.Player();
        player.x = 100;
        player.y = 100;
        player.username =
            (options === null || options === void 0 ? void 0 : options.username) || `Player#${Math.floor(Math.random() * 100)}`;
        this.room.state.players.set(client.sessionId, player);
    }
    onPlayerLeave(client, consented) {
        const leavingPlayer = this.room.state.players.get(client.sessionId);
        if (!leavingPlayer)
            return;
        if (leavingPlayer.isGrabbing) {
            const grabbedPlayer = this.room.state.players.get(leavingPlayer.isGrabbing);
            if (grabbedPlayer) {
                grabbedPlayer.isGrabbed = false;
                grabbedPlayer.grabbedBy = "";
                grabbedPlayer.escapeProgress = 0;
            }
        }
        if (leavingPlayer.isGrabbed && leavingPlayer.grabbedBy) {
            const grabber = this.room.state.players.get(leavingPlayer.grabbedBy);
            if (grabber)
                grabber.isGrabbing = "";
        }
        this.room.state.players.delete(client.sessionId);
    }
    handleMessage(client, type, message) {
        switch (type) {
            case "playerUpdate":
                this.handlePlayerUpdate(client, message);
                break;
            case "registerDisappearingBlocks":
                this.handleRegisterBlocks(client, message);
                break;
            case "playerHitBlock":
                this.handlePlayerHitBlock(client, message);
                break;
            case "registerSprings":
                this.handleRegisterSprings(client, message);
                break;
            case "playerHitSpring":
                this.handlePlayerHitSpring(client, message);
                break;
            case "requestGrab":
                this.handleRequestGrab(client, message);
                break;
            case "struggle":
                this.handleStruggle(client);
                break;
            case "playerDied":
                this.handlePlayerDied(client);
                break;
            case "playerImpact":
                this.handlePlayerImpact(client, message);
                break;
            case "registerBombSpawners":
                this.handleRegisterBombSpawners(client, message);
                break;
            case "playerHitBomb":
                this.handlePlayerHitBomb(client, message);
                break;
            case "updateBombState":
                this.handleUpdateBombState(client, message);
                break;
            default:
                break;
        }
    }
    cleanup() {
        var _a, _b;
        try {
            if (this.windChangeTimeout)
                (_b = (_a = this.windChangeTimeout).clear) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        catch (_c) { }
        this.bombSpawners.forEach((s) => {
            var _a, _b;
            try {
                (_b = (_a = s.timer) === null || _a === void 0 ? void 0 : _a.clear) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            catch (_c) { }
        });
        this.bombSpawners.clear();
    }
    handlePlayerUpdate(client, data) {
        const player = this.room.state.players.get(client.sessionId);
        if (!player)
            return;
        if (player.isGrabbed) {
            player.animState = data.animState;
            player.flipX = data.flipX;
            return;
        }
        const oldX = player.x;
        player.x = data.x;
        player.y = data.y;
        player.animState = data.animState;
        player.flipX = data.flipX;
        if (player.isGrabbing) {
            const grabbedPlayer = this.room.state.players.get(player.isGrabbing);
            if (grabbedPlayer) {
                const movedLeft = player.x < oldX;
                const movedRight = player.x > oldX;
                let targetX;
                let targetFlipX;
                const GRAB_DISTANCE = 30;
                if (movedLeft) {
                    targetX = player.x + GRAB_DISTANCE;
                    targetFlipX = true;
                }
                else if (movedRight) {
                    targetX = player.x - GRAB_DISTANCE;
                    targetFlipX = false;
                }
                else {
                    if (player.flipX) {
                        targetX = player.x + GRAB_DISTANCE;
                        targetFlipX = true;
                    }
                    else {
                        targetX = player.x - GRAB_DISTANCE;
                        targetFlipX = false;
                    }
                }
                grabbedPlayer.x = targetX;
                grabbedPlayer.y = player.y;
                grabbedPlayer.animState = player.animState;
                grabbedPlayer.flipX = targetFlipX;
            }
        }
    }
    handleRegisterBlocks(client, blocksData) {
        blocksData === null || blocksData === void 0 ? void 0 : blocksData.forEach((data) => {
            if (!this.room.state.disappearingBlocks.has(data.id)) {
                const block = new GameRoomState_1.DisappearingBlock();
                block.x = data.x;
                block.y = data.y;
                block.state = "idle";
                this.room.state.disappearingBlocks.set(data.id, block);
            }
        });
    }
    handlePlayerHitBlock(client, message) {
        const block = this.room.state.disappearingBlocks.get(message.blockId);
        if (block && block.state === "idle") {
            block.state = "triggered";
            this.room.clock.setTimeout(() => {
                if (this.room.state.disappearingBlocks.has(message.blockId)) {
                    this.room.state.disappearingBlocks.get(message.blockId).state =
                        "gone";
                }
            }, this.DISAPPEAR_DELAY);
            this.room.clock.setTimeout(() => {
                if (this.room.state.disappearingBlocks.has(message.blockId)) {
                    this.room.state.disappearingBlocks.get(message.blockId).state =
                        "idle";
                }
            }, this.DISAPPEAR_DELAY + this.REAPPEAR_DELAY);
        }
    }
    handleRegisterSprings(client, springsData) {
        springsData === null || springsData === void 0 ? void 0 : springsData.forEach((data) => {
            if (!this.room.state.springs.has(data.id)) {
                const spring = new GameRoomState_1.Spring();
                spring.x = data.x;
                spring.y = data.y;
                spring.state = "idle";
                this.room.state.springs.set(data.id, spring);
            }
        });
    }
    handlePlayerHitSpring(client, message) {
        const spring = this.room.state.springs.get(message.springId);
        if (spring && spring.state === "idle") {
            spring.state = "extended";
            this.room.clock.setTimeout(() => {
                if (this.room.state.springs.has(message.springId)) {
                    this.room.state.springs.get(message.springId).state = "idle";
                }
            }, this.SPRING_ANIMATION_DURATION);
        }
    }
    handleRequestGrab(client, message) {
        const grabber = this.room.state.players.get(client.sessionId);
        if (grabber && grabber.isGrabbing) {
            const grabbedPlayer = this.room.state.players.get(grabber.isGrabbing);
            if (grabbedPlayer) {
                grabber.isGrabbing = "";
                grabbedPlayer.isGrabbed = false;
                grabbedPlayer.grabbedBy = "";
                grabbedPlayer.escapeProgress = 0;
            }
            return;
        }
        const target = this.room.state.players.get(message.targetSessionId);
        if (grabber && target && !grabber.isGrabbing && !target.isGrabbed) {
            const distance = Math.hypot(grabber.x - target.x, grabber.y - target.y);
            if (distance <= this.GRAB_DISTANCE_THRESHOLD) {
                grabber.isGrabbing = message.targetSessionId;
                target.isGrabbed = true;
                target.grabbedBy = client.sessionId;
                target.escapeProgress = 0;
            }
        }
    }
    handleStruggle(client) {
        const player = this.room.state.players.get(client.sessionId);
        if (player && player.isGrabbed) {
            player.escapeProgress += this.ESCAPE_STRUGGLE_INCREMENT;
            if (player.escapeProgress >= 100) {
                const grabber = this.room.state.players.get(player.grabbedBy);
                if (grabber)
                    grabber.isGrabbing = "";
                player.isGrabbed = false;
                player.grabbedBy = "";
                player.escapeProgress = 0;
            }
        }
    }
    handlePlayerDied(client) {
        const deadPlayer = this.room.state.players.get(client.sessionId);
        if (!deadPlayer)
            return;
        if (deadPlayer.isGrabbing) {
            const grabbedPlayer = this.room.state.players.get(deadPlayer.isGrabbing);
            if (grabbedPlayer) {
                grabbedPlayer.isGrabbed = false;
                grabbedPlayer.grabbedBy = "";
                grabbedPlayer.escapeProgress = 0;
            }
            deadPlayer.isGrabbing = "";
        }
        if (deadPlayer.isGrabbed && deadPlayer.grabbedBy) {
            const grabber = this.room.state.players.get(deadPlayer.grabbedBy);
            if (grabber)
                grabber.isGrabbing = "";
            deadPlayer.isGrabbed = false;
            deadPlayer.grabbedBy = "";
            deadPlayer.escapeProgress = 0;
        }
    }
    handlePlayerImpact(client, message) {
        var _a, _b;
        const targetClient = (_b = (_a = this.room.clients) === null || _a === void 0 ? void 0 : _a.find) === null || _b === void 0 ? void 0 : _b.call(_a, (c) => c.sessionId === message.targetSessionId);
        if (targetClient) {
            targetClient.send("applyKnockback", {
                forceX: message.impactX,
                forceY: message.impactY,
            });
        }
    }
    handleRegisterBombSpawners(client, spawnersData) {
        spawnersData === null || spawnersData === void 0 ? void 0 : spawnersData.forEach((data, index) => {
            const spawnerId = `spawner_${index}`;
            if (this.bombSpawners.has(spawnerId))
                return;
            const spawnRate = (data.spawnRate || 5) * 1000;
            const bombLifetime = (data.bombLifetime || 10) * 1000;
            const timer = this.room.clock.setInterval(() => this.spawnBomb(spawnerId), spawnRate);
            this.bombSpawners.set(spawnerId, {
                id: spawnerId,
                x: data.x,
                y: data.y,
                spawnRate,
                bombLifetime,
                timer,
            });
        });
    }
    handlePlayerHitBomb(client, message) {
        const obj = this.interactiveObjectManager.getObject(message.bombId);
        if (obj)
            obj.explode();
    }
    handleUpdateBombState(client, message) {
        const obj = this.interactiveObjectManager.getObject(message.bombId);
        if (obj && obj.networkState.state === "ticking") {
            obj.networkState.x = message.x;
            obj.networkState.y = message.y;
            obj.networkState.velocityX = message.velocityX;
            obj.networkState.velocityY = message.velocityY;
        }
    }
    changeWindDirection() {
        const random = Math.random();
        if (random < 0.3)
            this.room.state.windDirectionMultiplier = -1.0;
        else if (random < 0.4)
            this.room.state.windDirectionMultiplier = 0.0;
        else
            this.room.state.windDirectionMultiplier = 1.0;
    }
    scheduleNextWindChange() {
        const randomDelay = Math.floor(Math.random() *
            (this.MAX_WIND_CHANGE_TIME - this.MIN_WIND_CHANGE_TIME + 1)) + this.MIN_WIND_CHANGE_TIME;
        this.room.state.nextWindChangeTime =
            this.room.clock.currentTime + randomDelay;
        this.windChangeTimeout = this.room.clock.setTimeout(() => {
            this.changeWindDirection();
            this.scheduleNextWindChange();
        }, randomDelay);
    }
    spawnBomb(spawnerId) {
        const spawner = this.bombSpawners.get(spawnerId);
        if (!spawner)
            return;
        this.interactiveObjectManager.spawnObject("bomb", spawner.x, spawner.y, {
            lifetimeMs: spawner.bombLifetime,
        });
    }
}
exports.PlatformerLogic = PlatformerLogic;
