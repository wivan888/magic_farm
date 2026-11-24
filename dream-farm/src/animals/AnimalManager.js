import * as THREE from 'three';
import { getAnimalSpec } from '../systems/GameData.js';

export class AnimalManager {
  constructor(stateManager, farmScene) {
    this.sm = stateManager;
    this.farmScene = farmScene;
    this.meshes = new Map();
  }

  buyAnimal(typeId) {
    const spec = getAnimalSpec(typeId);
    if (!spec) return { ok: false, msg: '未知動物' };
    const S = this.sm.state;
    const sameGroup = (S.animals || []).filter(a => getAnimalSpec(a.type)?.housing === spec.housing).length;
    if (sameGroup >= this.sm.getAnimalCapacity(spec.housing)) {
      return { ok: false, msg: `⚠️ ${spec.housing === 'coop' ? '雞舍' : '牛棚'}容量已滿，請先建造更多畜舍！` };
    }
    if (S.coins < spec.cost) return { ok: false, msg: '🪙 金幣不足！' };
    S.coins -= spec.cost;
    S.animals.push({ uid: Date.now() + Math.random(), type: spec.id, lastCollectAt: Date.now(), affection: 10, fedBoost: false });
    this.rebuildAnimals();
    return { ok: true, msg: `${spec.e} 歡迎【${spec.name}】加入牧場！` };
  }

  isProductReady(animal) {
    const spec = getAnimalSpec(animal.type);
    if (!spec) return false;
    const cycle = animal.fedBoost ? spec.cycle * 0.7 : spec.cycle;
    return (Date.now() - animal.lastCollectAt) / 1000 >= cycle;
  }

  getRemainingSeconds(animal) {
    const spec = getAnimalSpec(animal.type);
    if (!spec) return 0;
    const cycle = animal.fedBoost ? spec.cycle * 0.7 : spec.cycle;
    return Math.max(0, Math.ceil(cycle - (Date.now() - animal.lastCollectAt) / 1000));
  }

  feedAnimal(uid) {
    const a = (this.sm.state.animals || []).find(x => x.uid === uid);
    const spec = a && getAnimalSpec(a.type);
    if (!a || !spec) return { ok: false, msg: '找不到動物' };
    if (this.sm.state.coins < spec.feedCost) return { ok: false, msg: '🪙 飼料費不足！' };
    this.sm.state.coins -= spec.feedCost;
    a.fedBoost = true;
    a.affection = Math.min(100, (a.affection || 0) + 15);
    return { ok: true, msg: `🌾 餵食了 ${spec.name}，好感度上升且產出加速！` };
  }

  collectProduct(uid) {
    const a = (this.sm.state.animals || []).find(x => x.uid === uid);
    const spec = a && getAnimalSpec(a.type);
    if (!a || !spec || !this.isProductReady(a)) return { ok: false, msg: '尚未產出完成！' };
    a.lastCollectAt = Date.now();
    a.fedBoost = false;
    this.sm.addGood(spec.productId, 1);
    this.sm.addXp(16);
    return { ok: true, msg: `${spec.productEmoji} 收穫了【${spec.productName}】存入倉庫！` };
  }

  rebuildAnimals() {
    this.meshes.forEach(m => this.farmScene.scene.remove(m));
    this.meshes.clear();
    (this.sm.state.animals || []).forEach((a, idx) => {
      const spec = getAnimalSpec(a.type);
      if (!spec) return;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.55, 0.8),
        new THREE.MeshStandardMaterial({ color: spec.color })
      );
      mesh.position.set(7.5 + (idx % 3) * 1.4, 0.28, 6 + Math.floor(idx / 3) * 1.4);
      this.farmScene.scene.add(mesh);
      this.meshes.set(a.uid, mesh);
    });
  }

  update(dt, elapsed) {
    let i = 0;
    this.meshes.forEach((mesh) => {
      mesh.position.y = 0.28 + Math.abs(Math.sin(elapsed * 3 + i)) * 0.08;
      i++;
    });
  }
}
