"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractiveObjectManager = void 0;
const BombObject_1 = require("../objects/BombObject");
class InteractiveObjectManager {
    constructor(room) {
        this.pools = new Map();
        this.activeObjects = new Map();
        this.nextId = 0;
        this.objectFactory = new Map();
        this.room = room;
        this.registerObjectTypes();
    }
    registerObjectTypes() {
        this.objectFactory.set("bomb", (id, room) => new BombObject_1.BombObject(id, room));
    }
    getFromPool(type) {
        const pool = this.pools.get(type);
        if (!pool || pool.length === 0)
            return null;
        return pool.pop();
    }
    releaseToPool(object) {
        if (!this.pools.has(object.type))
            this.pools.set(object.type, []);
        this.pools.get(object.type).push(object);
    }
    spawnObject(type, x, y, options) {
        let obj = this.getFromPool(type);
        if (!obj) {
            const creator = this.objectFactory.get(type);
            if (!creator) {
                console.error(`[InteractiveObjectManager] Unknown object type: ${type}`);
                return null;
            }
            const newId = `${type}_${this.nextId++}`;
            obj = creator(newId, this.room);
        }
        this.activeObjects.set(obj.id, obj);
        obj.spawn(x, y, options);
        return obj;
    }
    despawnObject(object) {
        if (!this.activeObjects.has(object.id))
            return;
        object.despawn();
        this.activeObjects.delete(object.id);
        this.releaseToPool(object);
    }
    update(deltaTime) {
        this.activeObjects.forEach((obj) => obj.update(deltaTime));
    }
    getObject(id) {
        return this.activeObjects.get(id);
    }
}
exports.InteractiveObjectManager = InteractiveObjectManager;
