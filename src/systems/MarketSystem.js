import { GOODS_CATALOG, MUTATIONS, getCropById } from './GameData.js';

export class MarketSystem {
  constructor(stateManager) {
    this.sm = stateManager;
    this.elapsed = 0;
  }

  getCropRate(crop) {
    const day = this.sm.state.marketDay || 0;
    const seed = (crop.id.charCodeAt(0) * 17 + day * 31) % 45;
    return 0.85 + seed / 100;
  }

  calculateItemPrice(item, extraMult = 1) {
    const c = getCropById(item.cropId);
    let mutMult = 1.0;
    for (const mName of item.muts || []) {
      const m = MUTATIONS.find(x => x.name === mName);
      if (m) mutMult *= m.mult;
    }
    const fertMult = this.sm.state.fertilizer ? 1.2 : 1.0;
    const weightRatio = Math.max(0.5, (item.weight || c.maxWeight) / c.maxWeight);
    return Math.round(c.base * weightRatio * this.getCropRate(c) * mutMult * fertMult * extraMult);
  }

  calculateGoodPrice(goodId, extraMult = 1) {
    const spec = GOODS_CATALOG[goodId];
    if (!spec) return 20;
    const fertMult = this.sm.state.fertilizer ? 1.2 : 1.0;
    return Math.round(spec.basePrice * fertMult * extraMult);
  }

  tick() {
    this.elapsed++;
    if (this.elapsed >= 75) {
      this.elapsed = 0;
      this.sm.state.marketDay = (this.sm.state.marketDay || 0) + 1;
      return true;
    }
    return false;
  }
}
