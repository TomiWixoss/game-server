"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoomState = exports.Bomb = exports.Spring = exports.DisappearingBlock = exports.Player = void 0;
const schema_1 = require("@colyseus/schema");
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.x = 0;
        this.y = 0;
        this.animState = "idle";
        this.flipX = false;
        this.username = "Player"; // <-- THÊM MỚI
        // <-- THÊM CÁC TRƯỜNG MỚI CHO TÍNH NĂM VÀ THOÁT -->
        this.isGrabbed = false; // Bị người khác nắm?
        this.grabbedBy = ""; // ID của người đang nắm mình
        this.isGrabbing = ""; // ID của người mình đang nắm
        this.escapeProgress = 0; // Tiến trình thoát (0-100)
    }
}
exports.Player = Player;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Player.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Player.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], Player.prototype, "animState", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], Player.prototype, "flipX", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], Player.prototype, "username", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], Player.prototype, "isGrabbed", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], Player.prototype, "grabbedBy", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], Player.prototype, "isGrabbing", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Player.prototype, "escapeProgress", void 0);
// THÊM MỚI: Schema để định nghĩa trạng thái của một block có thể biến mất
class DisappearingBlock extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.x = 0; // Tọa độ tile X
        this.y = 0; // Tọa độ tile Y
        // Trạng thái của block:
        // 'idle': Bình thường, có thể va chạm.
        // 'triggered': Bị người chơi chạm, đang chuẩn bị biến mất (dùng để client chạy hiệu ứng rung).
        // 'gone': Đã biến mất, không thể va chạm.
        this.state = "idle";
    }
}
exports.DisappearingBlock = DisappearingBlock;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], DisappearingBlock.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], DisappearingBlock.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], DisappearingBlock.prototype, "state", void 0);
// THÊM MỚI: Schema để định nghĩa trạng thái của một lò xo
class Spring extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.x = 0; // Tọa độ tile X
        this.y = 0; // Tọa độ tile Y
        // Trạng thái: 'idle' (bị nén) hoặc 'extended' (bung ra)
        this.state = "idle";
    }
}
exports.Spring = Spring;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Spring.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Spring.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], Spring.prototype, "state", void 0);
// THÊM MỚI: Schema định nghĩa trạng thái của một quả bom
class Bomb extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.x = 0;
        this.y = 0;
        // Vận tốc để client khác có thể nội suy
        this.velocityX = 0;
        this.velocityY = 0;
        // Trạng thái: 'ticking' (đang rơi/lăn), 'exploding' (vừa nổ)
        this.state = "ticking";
    }
}
exports.Bomb = Bomb;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Bomb.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Bomb.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Bomb.prototype, "velocityX", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Bomb.prototype, "velocityY", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], Bomb.prototype, "state", void 0);
class GameRoomState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        // THÊM MỚI: Một Map để lưu trạng thái của tất cả các block biến mất trong phòng.
        // Key của map sẽ là ID duy nhất của block (ví dụ: "10_15").
        this.disappearingBlocks = new schema_1.MapSchema();
        // THÊM MỚI: Map để lưu trạng thái của tất cả các lò xo
        this.springs = new schema_1.MapSchema();
        // ======================== THÊM CÁC DÒNG MỚI DƯỚI ĐÂY ========================
        // Hệ số hướng gió: 1.0 = trái, -1.0 = phải, 0.0 = không gió
        this.windDirectionMultiplier = 1.0;
        // Thời điểm (timestamp của server) mà gió sẽ đổi hướng tiếp theo
        this.nextWindChangeTime = 0;
        // =========================================================================
        // THÊM MỚI: Map để lưu trạng thái của tất cả các quả bom đang hoạt động
        this.bombs = new schema_1.MapSchema();
    }
}
exports.GameRoomState = GameRoomState;
__decorate([
    (0, schema_1.type)({ map: Player }),
    __metadata("design:type", Object)
], GameRoomState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)({ map: DisappearingBlock }),
    __metadata("design:type", Object)
], GameRoomState.prototype, "disappearingBlocks", void 0);
__decorate([
    (0, schema_1.type)({ map: Spring }),
    __metadata("design:type", Object)
], GameRoomState.prototype, "springs", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameRoomState.prototype, "windDirectionMultiplier", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameRoomState.prototype, "nextWindChangeTime", void 0);
__decorate([
    (0, schema_1.type)({ map: Bomb }),
    __metadata("design:type", Object)
], GameRoomState.prototype, "bombs", void 0);
