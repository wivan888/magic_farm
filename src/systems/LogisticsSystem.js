export class LogisticsSystem {
  constructor(stateManager, marketSystem) {
    this.sm = stateManager;
    this.market = marketSystem;
    if (!this.sm.state.logistics) {
      this.sm.state.logistics = { level: 0, autoShipThreshold: 0.85, totalShippedCoins: 0, totalShippedCount: 0 };
    }
  }

  getUpgradeCost() {
    const lv = this.sm.state.logistics?.level || 0;
    return lv >= 5 ? null : 350 * (lv + 1);
  }

  upgrade() {
    const cost = this.getUpgradeCost();
    if (cost === null) return { ok: false, msg: '物流中心已達最高等級！' };
    if (this.sm.state.coins < cost) return { ok: false, msg: '🪙 金幣不足！' };
    this.sm.state.coins -= cost;
    this.sm.state.logistics.level += 1;
    return { ok: true, msg: `🚚 自動物流中心升至 Lv.${this.sm.state.logistics.level}！` };
  }

  tick(priceMultiplier = 1.0) {
    const S = this.sm.state;
    const logi = S.logistics;
    if (!logi || logi.level <= 0) return null;
    const maxCap = this.sm.getMaxInventoryCapacity();
    if (S.inventory.length < Math.max(2, Math.floor(maxCap * logi.autoShipThreshold))) return null;

    const batch = Math.min(logi.level, S.inventory.length);
    const bonusMult = priceMultiplier * (1 + logi.level * 0.05);
    let earned = 0;
    for (let i = 0; i < batch; i++) {
      const item = S.inventory.pop();
      if (!item) break;
      earned += Math.round(this.market.calculateItemPrice(item, 1) * bonusMult);
    }
    if (earned > 0) {
      S.coins += earned;
      logi.totalShippedCoins += earned;
      logi.totalShippedCount += batch;
      return `🚚 物流無人機自動出貨 ${batch} 件作物，入帳 +${earned} 🪙！`;
    }
    return null;
  }
}
