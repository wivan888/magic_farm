import { CROPS, GOODS_CATALOG } from './GameData.js';

const TOWNSFOLK = [
  { name: '麵包師傅・羅伯特', e: '👨‍🍳' },
  { name: '花店老闆・艾莉絲', e: '👩‍🌾' },
  { name: '酒館掌櫃・巴尼',   e: '🧔' },
  { name: '鎮長・亞瑟',       e: '🎩' },
  { name: '美食評論家・蘇菲', e: '🧐' }
];

export const REPUTATION_RANKS = [
  { minRep: 0,    title: '見習新星農場',   badge: '🌱', bonusMult: 1.00 },
  { minRep: 100,  title: '小鎮優質供應商', badge: '🥉', bonusMult: 1.08 },
  { minRep: 300,  title: '區域金牌莊園',   badge: '🥈', bonusMult: 1.16 },
  { minRep: 650,  title: '皇家御用農莊',   badge: '🥇', bonusMult: 1.25 },
  { minRep: 1200, title: '傳奇世界生態園', badge: '👑', bonusMult: 1.38 }
];

export class TownOrderSystem {
  constructor(stateManager) {
    this.sm = stateManager;
    if (typeof this.sm.state.reputation !== 'number') this.sm.state.reputation = 0;
    if (!Array.isArray(this.sm.state.townOrders) || this.sm.state.townOrders.length === 0) {
      this.sm.state.townOrders = [];
      this.refillOrders();
    }
  }

  getReputationRank() {
    const rep = this.sm.state.reputation || 0;
    let current = REPUTATION_RANKS[0];
    for (const r of REPUTATION_RANKS) if (rep >= r.minRep) current = r;
    return current;
  }

  generateOrder() {
    const npc = TOWNSFOLK[Math.floor(Math.random() * TOWNSFOLK.length)];
    const availableCrops = CROPS.filter(c => c.level <= Math.max(1, this.sm.state.level));
    const goodKeys = Object.keys(GOODS_CATALOG);

    if (Math.random() < 0.65 || goodKeys.length === 0) {
      const crop = availableCrops[Math.floor(Math.random() * availableCrops.length)];
      const qty = 1 + Math.floor(Math.random() * 2);
      return {
        id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        npcName: npc.name,
        npcEmoji: npc.e,
        reqType: 'crop',
        targetId: crop.id,
        label: `${crop.e} ${crop.name} ×${qty}`,
        qty,
        rewardCoins: Math.round(crop.base * qty * 2.1 + 45),
        rewardRep: 18 + qty * 8,
        rewardXp: 25 + qty * 10
      };
    } else {
      const gId = goodKeys[Math.floor(Math.random() * goodKeys.length)];
      const gSpec = GOODS_CATALOG[gId];
      return {
        id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        npcName: npc.name,
        npcEmoji: npc.e,
        reqType: 'good',
        targetId: gId,
        label: `${gSpec.e} ${gSpec.name} ×1`,
        qty: 1,
        rewardCoins: Math.round((gSpec.basePrice || 80) * 1.9 + 60),
        rewardRep: 30,
        rewardXp: 40
      };
    }
  }

  refillOrders() {
    while ((this.sm.state.townOrders || []).length < 3) {
      this.sm.state.townOrders.push(this.generateOrder());
    }
  }

  canFulfill(order) {
    const S = this.sm.state;
    if (order.reqType === 'crop') return (S.inventory || []).filter(i => i.cropId === order.targetId).length >= order.qty;
    if (order.reqType === 'good') return ((S.goodsBag || {})[order.targetId] || 0) >= order.qty;
    return false;
  }

  fulfillOrder(orderId, craftBonusLevel = 0) {
    const S = this.sm.state;
    const idx = (S.townOrders || []).findIndex(o => o.id === orderId);
    if (idx === -1) return { ok: false, msg: '委託已過期' };
    const order = S.townOrders[idx];
    if (!this.canFulfill(order)) return { ok: false, msg: '背包庫存不足，無法交付委託！' };

    if (order.reqType === 'crop') {
      let removed = 0;
      S.inventory = S.inventory.filter(item => {
        if (removed < order.qty && item.cropId === order.targetId) { removed++; return false; }
        return true;
      });
    } else if (order.reqType === 'good') {
      S.goodsBag[order.targetId] -= order.qty;
    }

    const finalCoins = Math.round(order.rewardCoins * this.getReputationRank().bonusMult * (1 + craftBonusLevel * 0.08));
    S.coins += finalCoins;
    S.reputation = (S.reputation || 0) + order.rewardRep;
    this.sm.addXp(order.rewardXp);
    S.townOrders.splice(idx, 1);
    this.refillOrders();
    return { ok: true, msg: `📜 交付「${order.npcName}」委託！獲得 +${finalCoins} 🪙、+${order.rewardRep} 名聲！` };
  }

  refreshOrders() {
    if (this.sm.state.coins < 30) return { ok: false, msg: '🪙 金幣不足（需 30 🪙）！' };
    this.sm.state.coins -= 30;
    this.sm.state.townOrders = [];
    this.refillOrders();
    return { ok: true, msg: '🔄 已更新鎮民委託布告欄！' };
  }
}
