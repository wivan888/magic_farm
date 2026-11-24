import * as THREE from 'three';

export const WORLD_WONDERS = [
  { id: 'solar_obelisk', name: '永恆太陽方尖碑', e: '🗿', cost: 2800, pos: { x: 12.5, z: -9.5 }, desc: '矗立於農場東北角的古老奇觀，永久提升全農場售價 +15% 與經驗 +15%' },
  { id: 'world_tree',    name: '生命世界樹聖殿', e: '🌳', cost: 3600, pos: { x: -12.5, z: -9.5 }, desc: '散發自然靈氣的巨樹奇觀，永久縮短全作物生長時間 15% 並提升突變率 +12%' }
];

export class WonderSystem {
  constructor(stateManager, farmScene) {
    this.sm = stateManager;
    this.farmScene = farmScene;
    if (!Array.isArray(this.sm.state.wonders)) this.sm.state.wonders = [];
    this.meshes = new Map();
  }

  hasWonder(id) { return (this.sm.state.wonders || []).includes(id); }

  buildWonder(id) {
    const spec = WORLD_WONDERS.find(w => w.id === id);
    if (!spec) return { ok: false, msg: '未知奇觀建築' };
    if (this.hasWonder(id)) return { ok: false, msg: '這座世界奇觀已經建成了！' };
    if (this.sm.state.coins < spec.cost) return { ok: false, msg: '🪙 建造奇觀所需金幣不足！' };
    this.sm.state.coins -= spec.cost;
    this.sm.state.wonders.push(id);
    this.sm.addXp(150);
    this.syncVisuals();
    return { ok: true, msg: `🏛️ 世界奇觀【${spec.name}】落成！獲得永久光環！` };
  }

  syncVisuals() {
    if (!this.farmScene?.scene) return;
    for (const spec of WORLD_WONDERS) {
      if (this.hasWonder(spec.id) && !this.meshes.has(spec.id)) {
        const group = new THREE.Group();
        group.position.set(spec.pos.x, 0, spec.pos.z);

        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(2.1, 2.5, 0.5, 16),
          new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.4 })
        );
        base.position.y = 0.25;
        group.add(base);

        if (spec.id === 'solar_obelisk') {
          const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.85, 4.2, 4),
            new THREE.MeshStandardMaterial({ color: 0xffd43b, metalness: 0.5, roughness: 0.25 })
          );
          pillar.position.y = 2.6;
          group.add(pillar);

          const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.55, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xff922b, emissive: 0xff6b00, emissiveIntensity: 0.6 })
          );
          orb.position.y = 5.3;
          group.add(orb);
          group.userData.orb = orb;
        } else {
          const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.95, 3.2, 12),
            new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.9 })
          );
          trunk.position.y = 1.9;
          group.add(trunk);

          const crown = new THREE.Mesh(
            new THREE.DodecahedronGeometry(2.2, 1),
            new THREE.MeshStandardMaterial({ color: 0x37b24d, emissive: 0x1b4332, emissiveIntensity: 0.25 })
          );
          crown.position.y = 4.3;
          group.add(crown);
          group.userData.orb = crown;
        }

        this.farmScene.scene.add(group);
        this.meshes.set(spec.id, group);
      }
    }
  }

  update(elapsed) {
    this.meshes.forEach((group) => {
      if (group.userData.orb) {
        group.userData.orb.rotation.y = elapsed * 0.8;
        group.userData.orb.position.y += Math.sin(elapsed * 2.2) * 0.002;
      }
    });
  }

  getSellMultiplier() { return this.hasWonder('solar_obelisk') ? 1.15 : 1.0; }
  getGrowthMultiplier() { return this.hasWonder('world_tree') ? 0.85 : 1.0; }
  getExtraMutationChance() { return this.hasWonder('world_tree') ? 0.12 : 0.0; }
}
