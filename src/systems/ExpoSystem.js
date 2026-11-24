export const OUTFIT_CATALOG = [
  { id: 'classic',   name: '經典草帽農夫裝',   e: '👨‍🌾', cost: 0,    shirtColor: 0x3b82f6, hatColor: 0xeab308, bonusSell: 0,    desc: '簡約耐穿的經典田園工作服（無額外加成）' },
  { id: 'ranger',    name: '翡翠森林遊俠裝',   e: '🧝', cost: 450,  shirtColor: 0x2b8a3e, hatColor: 0x1b4332, bonusSell: 0.05, desc: '融入自然氣息的遊俠裝束，全農場出售價格 +5%' },
  { id: 'royal',     name: '皇家金穗莊園禮服', e: '🤴', cost: 950,  shirtColor: 0xe67700, hatColor: 0xffd43b, bonusSell: 0.10, desc: '象徵莊園榮耀的金色禮服，全農場出售價格 +10%' },
  { id: 'alchemist', name: '星辰奧術鍊金袍',   e: '🧙', cost: 1600, shirtColor: 0x6741d9, hatColor: 0x3b5bdb, bonusSell: 0.16, desc: '蘊含星辰魔力的鍊金長袍，全農場出售價格 +16%' }
];

export class ExpoSystem {
  constructor(stateManager, playerController) {
    this.sm = stateManager;
    this.playerCtrl = playerController;
    if (!Array.isArray(this.sm.state.unlockedOutfits)) this.sm.state.unlockedOutfits = ['classic'];
    if (!this.sm.state.currentOutfit) this.sm.state.currentOutfit = 'classic';
    if (!this.sm.state.expoRecord) this.sm.state.expoRecord = { bestScore: 0, bestRank: '尚未參賽', lastEntryAt: 0 };
  }

  getCurrentOutfitSpec() {
    return OUTFIT_CATALOG.find(o => o.id === this.sm.state.currentOutfit) || OUTFIT_CATALOG[0];
  }

  getOutfitSellMultiplier() {
    return 1 + (this.getCurrentOutfitSpec().bonusSell || 0);
  }

  applyOutfitVisuals() {
    const spec = this.getCurrentOutfitSpec();
    const player = this.playerCtrl?.player;
    if (!player) return;
    player.traverse((child) => {
      if (child.isMesh && child.material && child.material.color) {
        if (child.position.y >= 1.35) child.material.color.setHex(spec.hatColor);
        else if (child.position.y >= 0.55 && child.position.y < 1.15) child.material.color.setHex(spec.shirtColor);
      }
    });
  }

  selectOrBuyOutfit(outfitId) {
    const spec = OUTFIT_CATALOG.find(o => o.id === outfitId);
    if (!spec) return { ok: false, msg: '未知服裝款式' };
    const S = this.sm.state;
    const unlocked = new Set(S.unlockedOutfits || ['classic']);
    if (!unlocked.has(outfitId)) {
      if (S.coins < spec.cost) return { ok: false, msg: `🪙 金幣不足（需 ${spec.cost} 🪙）！` };
      S.coins -= spec.cost;
      unlocked.add(outfitId);
      S.unlockedOutfits = Array.from(unlocked);
    }
    S.currentOutfit = outfitId;
    this.applyOutfitVisuals();
    return { ok: true, msg: `👔 已換上【${spec.name}】！` };
  }

  evaluateFarmScore() {
    const S = this.sm.state;
    const codex = S.codex || { crops: [], animals: [], goods: [], mutations: [] };
    const codexCount = codex.crops.length + codex.animals.length + codex.goods.length + codex.mutations.length;
    const buildingPts = (S.buildings?.length || 0) * 45;
    const animalPts = (S.animals?.length || 0) * 55;
    const wonderPts = (S.wonders?.length || 0) * 320;
    const codexPts = codexCount * 35;
    const repPts = Math.floor((S.reputation || 0) * 0.6);
    const levelPts = (S.level || 1) * 60;
    const total = buildingPts + animalPts + wonderPts + codexPts + repPts + levelPts;
    return { total, breakdown: { buildingPts, animalPts, wonderPts, codexPts, repPts, levelPts } };
  }

  enterExpo() {
    const S = this.sm.state;
    const now = Date.now();
    const rem = Math.ceil((30000 - (now - (S.expoRecord?.lastEntryAt || 0))) / 1000);
    if (rem > 0) return { ok: false, msg: `⏳ 評審團正在休息，請於 ${rem} 秒後再報名參賽！` };

    const { total } = this.evaluateFarmScore();
    let rank = '🥉 博覽會銅牌獎', prize = 180, repGain = 15;
    if (total >= 2600) { rank = '👑 傳奇世界金穗大獎'; prize = 1200; repGain = 90; }
    else if (total >= 1700) { rank = '🥇 博覽會金牌獎'; prize = 720; repGain = 55; }
    else if (total >= 950) { rank = '🥈 博覽會銀牌獎'; prize = 380; repGain = 30; }

    S.coins += prize;
    S.reputation = (S.reputation || 0) + repGain;
    this.sm.addXp(50);
    S.expoRecord = { bestScore: Math.max(S.expoRecord?.bestScore || 0, total), bestRank: rank, lastEntryAt: now };
    return { ok: true, score: total, rank, prize, msg: `🎪 博覽會總分 ${total} 分，榮獲【${rank}】！獎金 +${prize} 🪙、+${repGain} 名聲！` };
  }
}
