import * as THREE from 'three';

export const FISH_CATALOG = [
  { id: 'carp',     name: '錦鯉',     e: '🐟', rarity: '普通', weight: 0.45, price: 45,  xp: 12 },
  { id: 'salmon',   name: '溪鮭',     e: '🐠', rarity: '稀有', weight: 0.28, price: 95,  xp: 24 },
  { id: 'lobster',  name: '藍龍蝦',   e: '🦞', rarity: '史詩', weight: 0.17, price: 185, xp: 45 },
  { id: 'koi_gold', name: '黃金龍魚', e: '🐉', rarity: '傳說', weight: 0.10, price: 420, xp: 90 }
];

export class FishingSystem {
  constructor(stateManager, farmScene) {
    this.sm = stateManager;
    this.farmScene = farmScene;
    if (!Array.isArray(this.sm.state.fishBag)) this.sm.state.fishBag = [];
    this.fishMesh = null;
    this.buildPond();
  }

  buildPond() {
    if (!this.farmScene?.scene) return;
    const g = new THREE.Group();
    g.position.set(-11.5, 0.04, 8.5);

    const rim = new THREE.Mesh(
      new THREE.RingGeometry(2.5, 3.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x868e96, roughness: 0.9, side: THREE.DoubleSide })
    );
    rim.rotation.x = -Math.PI / 2;
    g.add(rim);

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(2.55, 24),
      new THREE.MeshStandardMaterial({ color: 0x22b8cf, roughness: 0.2 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.02;
    g.add(water);

    const fish = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.65, 8),
      new THREE.MeshStandardMaterial({ color: 0xff6b6b })
    );
    fish.rotation.z = Math.PI / 2;
    fish.position.set(1.0, 0.12, 0);
    g.add(fish);

    this.farmScene.scene.add(g);
    this.fishMesh = fish;
  }

  update(elapsed) {
    if (!this.fishMesh) return;
    const angle = elapsed * 1.4;
    this.fishMesh.position.x = Math.cos(angle) * 1.35;
    this.fishMesh.position.z = Math.sin(angle) * 1.35;
    this.fishMesh.rotation.y = -angle;
  }

  castLine(seasonPriceMult = 1.0) {
    const S = this.sm.state;
    if (S.coins < 15) return { ok: false, msg: '🪙 魚餌費用不足（需 15 🪙）！' };
    S.coins -= 15;

    const r = Math.random();
    let acc = 0;
    let caught = FISH_CATALOG[0];
    for (const f of FISH_CATALOG) {
      acc += f.weight;
      if (r <= acc) { caught = f; break; }
    }

    const weightKg = Number((0.8 + Math.random() * 2.4).toFixed(2));
    const entry = {
      uid: Date.now() + Math.random(),
      fishId: caught.id,
      name: caught.name,
      e: caught.e,
      rarity: caught.rarity,
      weight: weightKg,
      price: Math.round(caught.price * (0.85 + weightKg * 0.15) * seasonPriceMult)
    };
    S.fishBag.unshift(entry);
    this.sm.addXp(caught.xp);
    return { ok: true, entry, msg: `🎣 釣到了【${caught.rarity}】${caught.e} ${caught.name} (${weightKg}kg)！` };
  }

  sellAllFish() {
    const S = this.sm.state;
    const total = (S.fishBag || []).reduce((sum, f) => sum + f.price, 0);
    if (total <= 0) return { ok: false, msg: '魚簍裡目前沒有漁獲！' };
    S.fishBag = [];
    S.coins += total;
    return { ok: true, total, msg: `🐟 漁獲全數售出，獲得 ${total} 🪙！` };
  }
}
