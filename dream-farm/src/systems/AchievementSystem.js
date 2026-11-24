import { CROPS, ANIMALS, GOODS_CATALOG, MUTATIONS } from './GameData.js';

export const ACHIEVEMENTS = [
  { id: 'first_harvest', name: '初次豐收',   e: '🌾', desc: '累計收成 1 次作物',       reward: 80,  check: (s) => s.harvests >= 1 },
  { id: 'master_farmer', name: '勤奮莊園主', e: '🚜', desc: '累計收成 25 次作物',      reward: 300, check: (s) => s.harvests >= 25 },
  { id: 'rich_tycoon',   name: '田園大富翁', e: '💰', desc: '持有金幣達到 2,500 🪙',   reward: 450, check: (s) => s.coins >= 2500 },
  { id: 'builder_pro',   name: '建築大師',   e: '🏗️', desc: '農場內建造至少 5 座建築', reward: 260, check: (s) => (s.buildings?.length || 0) >= 5 },
  { id: 'rancher_love',  name: '牧場守護者', e: '🐄', desc: '飼養至少 3 隻牧場動物',   reward: 280, check: (s) => (s.animals?.length || 0) >= 3 },
  { id: 'wonder_lord',   name: '奇觀締造者', e: '🏛️', desc: '建成至少 1 座世界奇觀',   reward: 800, check: (s) => (s.wonders?.length || 0) >= 1 }
];

export class AchievementSystem {
  constructor(stateManager) {
    this.sm = stateManager;
    if (!this.sm.state.codex) {
      this.sm.state.codex = { crops: [], animals: [], goods: [], mutations: [] };
    }
    if (!Array.isArray(this.sm.state.unlockedAchievements)) {
      this.sm.state.unlockedAchievements = [];
    }
  }

  recordCrop(cropId, muts = []) {
    const c = this.sm.state.codex;
    if (!c.crops.includes(cropId)) c.crops.push(cropId);
    muts.forEach(m => { if (!c.mutations.includes(m)) c.mutations.push(m); });
  }

  recordAnimal(animalId) {
    const c = this.sm.state.codex;
    if (!c.animals.includes(animalId)) c.animals.push(animalId);
  }

  recordGood(goodId) {
    const c = this.sm.state.codex;
    if (!c.goods.includes(goodId)) c.goods.push(goodId);
  }

  getCodexProgress() {
    const c = this.sm.state.codex;
    const owned = c.crops.length + c.animals.length + c.goods.length + c.mutations.length;
    const total = CROPS.length + ANIMALS.length + Object.keys(GOODS_CATALOG).length + MUTATIONS.length;
    return { owned, total, percent: Math.round((owned / total) * 100) };
  }

  evaluate() {
    const S = this.sm.state;
    const newlyUnlocked = [];
    for (const ach of ACHIEVEMENTS) {
      if (!S.unlockedAchievements.includes(ach.id) && ach.check(S)) {
        S.unlockedAchievements.push(ach.id);
        S.coins += ach.reward;
        newlyUnlocked.push(ach);
      }
    }
    return newlyUnlocked;
  }
}
