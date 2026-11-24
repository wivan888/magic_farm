export const TECH_TREE = [
  { id: 'bio_gene',      name: '基因選育學',       e: '🧬', maxLv: 3, baseCost: 300, desc: '每級提升作物突變機率 +8% 與基礎重量 +6%' },
  { id: 'hydroponics',   name: '水耕循環溫室技術', e: '💧', maxLv: 3, baseCost: 350, desc: '每級縮短全作物生長時間 7% 並提升澆水加速效果' },
  { id: 'cold_chain',    name: '冷鏈保鮮包裝',     e: '❄️', maxLv: 3, baseCost: 400, desc: '每級提升農作物、漁獲與加工品最終售價 +8%' },
  { id: 'gourmet_craft', name: '職人精密烘焙',     e: '👨‍🍳', maxLv: 3, baseCost: 450, desc: '每級提升鎮民委託報酬 +8%' }
];

export class ResearchSystem {
  constructor(stateManager) {
    this.sm = stateManager;
    if (!this.sm.state.techLevels) {
      this.sm.state.techLevels = { bio_gene: 0, hydroponics: 0, cold_chain: 0, gourmet_craft: 0 };
    }
  }

  getLevel(techId) { return this.sm.state.techLevels?.[techId] || 0; }

  getUpgradeCost(techId) {
    const spec = TECH_TREE.find(t => t.id === techId);
    if (!spec) return null;
    const lv = this.getLevel(techId);
    return lv >= spec.maxLv ? null : spec.baseCost * (lv + 1);
  }

  research(techId) {
    const spec = TECH_TREE.find(t => t.id === techId);
    const cost = this.getUpgradeCost(techId);
    if (!spec || cost === null) return { ok: false, msg: '該科技已研發至最高等級！' };
    if (this.sm.state.coins < cost) return { ok: false, msg: '🪙 研發經費不足！' };
    this.sm.state.coins -= cost;
    this.sm.state.techLevels[techId] = this.getLevel(techId) + 1;
    this.sm.addXp(35);
    return { ok: true, msg: `🔬 研發完成！【${spec.name}】升至 Lv.${this.sm.state.techLevels[techId]}！` };
  }

  getGrowthMultiplier() { return Math.max(0.65, 1 - this.getLevel('hydroponics') * 0.07); }
  getSellMultiplier() { return 1 + this.getLevel('cold_chain') * 0.08; }
  getWeightMultiplier() { return 1 + this.getLevel('bio_gene') * 0.06; }
  getExtraMutationChance() { return this.getLevel('bio_gene') * 0.08; }
}
