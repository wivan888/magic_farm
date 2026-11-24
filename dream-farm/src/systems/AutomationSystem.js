import { AUTOMATION_CONFIG, getCropById } from './GameData.js';

export class AutomationSystem {
  constructor(stateManager, farmingManager, buildingManager, farmScene) {
    this.sm = stateManager;
    this.farming = farmingManager;
    this.buildings = buildingManager;
    this.farmScene = farmScene;
    this.counter = 0;
  }

  getUpgradeCost(id) {
    const cfg = AUTOMATION_CONFIG[id];
    const lv = this.sm.state.automation[id] || 0;
    if (!cfg || lv >= cfg.maxLv) return null;
    return cfg.baseCost * (lv + 1);
  }

  upgradeMachine(id) {
    const cost = this.getUpgradeCost(id);
    if (cost === null) return { ok: false, msg: '已達最高等級！' };
    if (this.sm.state.coins < cost) return { ok: false, msg: '🪙 金幣不足！' };
    this.sm.state.coins -= cost;
    this.sm.state.automation[id] = (this.sm.state.automation[id] || 0) + 1;
    return { ok: true, msg: `⚙️ ${AUTOMATION_CONFIG[id].name} 升至 Lv.${this.sm.state.automation[id]}！` };
  }

  toggleEnabled() {
    this.sm.state.automation.enabled = !this.sm.state.automation.enabled;
  }

  syncVisuals() {}
  updateVisuals() {}

  tick(onLevelUp) {
    const S = this.sm.state;
    if (!S.automation?.enabled) return null;
    this.counter++;
    if (this.counter % 3 !== 0) return null;

    let actions = 0;
    // 自動收割
    if (S.automation.harvester > 0) {
      let quota = S.automation.harvester;
      for (let i = 0; i < S.plots.length && quota > 0; i++) {
        const p = S.plots[i];
        if (p && this.farming.isMature(p) && S.inventory.length < this.sm.getMaxInventoryCapacity()) {
          const c = getCropById(p.id);
          const w = Number((c.maxWeight * (0.6 + Math.random() * 0.4)).toFixed(2));
          S.inventory.unshift({ uid: Date.now() + Math.random(), cropId: c.id, weight: w, muts: p.muts || [] });
          S.plots[i] = null;
          S.harvests++;
          this.sm.addXp(c.xp, onLevelUp);
          quota--;
          actions++;
        }
      }
    }

    // 自動澆水
    if (S.automation.sprinkler > 0) {
      let quota = S.automation.sprinkler * 2;
      for (let i = 0; i < S.plots.length && quota > 0; i++) {
        const p = S.plots[i];
        if (p && !this.farming.isMature(p)) {
          p.at -= 3000;
          quota--;
        }
      }
    }

    // 自動播種
    if (S.automation.seeder > 0) {
      let quota = S.automation.seeder;
      const c = getCropById(S.seed);
      for (let i = 0; i < S.plots.length && quota > 0; i++) {
        if (!S.plots[i] && S.coins >= c.cost) {
          S.coins -= c.cost;
          S.plots[i] = { id: c.id, at: Date.now(), time: c.time * this.sm.getGrowthSpeedMultiplier(), muts: this.farming.rollMutations() };
          quota--;
          actions++;
        }
      }
    }

    return actions > 0 ? `⚙️ 自動化農機完成了 ${actions} 項田間作業！` : null;
  }
}
