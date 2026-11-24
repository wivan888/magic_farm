import { RECIPES, GOODS_CATALOG, getCropById } from './GameData.js';

export class ProcessingSystem {
  constructor(stateManager, buildingManager) {
    this.sm = stateManager;
    this.buildings = buildingManager;
  }

  getFactoryCount() {
    return (this.sm.state.buildings || []).filter(b => b.type === 'factory').length;
  }

  getIngredientStatusText(recipe) {
    const parts = [];
    Object.entries(recipe.crops || {}).forEach(([cid, need]) => {
      const have = (this.sm.state.inventory || []).filter(i => i.cropId === cid).length;
      parts.push(`${getCropById(cid).name} ${have}/${need}`);
    });
    Object.entries(recipe.goods || {}).forEach(([gid, need]) => {
      const have = (this.sm.state.goodsBag || {})[gid] || 0;
      parts.push(`${GOODS_CATALOG[gid]?.name} ${have}/${need}`);
    });
    return parts.join('、');
  }

  canCraft(recipe) {
    if (this.getFactoryCount() <= 0) return false;
    if ((this.sm.state.processingQueue || []).length >= this.getFactoryCount() * 2) return false;
    for (const [cid, need] of Object.entries(recipe.crops || {})) {
      const have = (this.sm.state.inventory || []).filter(i => i.cropId === cid).length;
      if (have < need) return false;
    }
    for (const [gid, need] of Object.entries(recipe.goods || {})) {
      if (((this.sm.state.goodsBag || {})[gid] || 0) < need) return false;
    }
    return true;
  }

  startCraft(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe || !this.canCraft(recipe)) return { ok: false, msg: '原料不足或工坊佇列已滿！' };
    const S = this.sm.state;
    Object.entries(recipe.crops || {}).forEach(([cid, need]) => {
      let rem = need;
      S.inventory = S.inventory.filter(item => {
        if (rem > 0 && item.cropId === cid) { rem--; return false; }
        return true;
      });
    });
    Object.entries(recipe.goods || {}).forEach(([gid, need]) => {
      S.goodsBag[gid] -= need;
    });
    if (!S.processingQueue) S.processingQueue = [];
    S.processingQueue.push({ recipeId: recipe.id, startedAt: Date.now(), duration: recipe.duration });
    return { ok: true, msg: `🏭 開始製作【${recipe.name}】！` };
  }

  tick() {
    const S = this.sm.state;
    if (!S.processingQueue?.length) return null;
    const now = Date.now();
    const done = [];
    S.processingQueue = S.processingQueue.filter(task => {
      if ((now - task.startedAt) / 1000 >= task.duration) {
        done.push(task);
        return false;
      }
      return true;
    });
    if (!done.length) return null;
    done.forEach(t => {
      const r = RECIPES.find(x => x.id === t.recipeId);
      if (r) {
        this.sm.addGood(r.outputId, 1);
        if (!S.codex) S.codex = { crops: [], animals: [], goods: [], mutations: [] };
        if (!S.codex.goods.includes(r.outputId)) S.codex.goods.push(r.outputId);
      }
    });
    return `✨ 加工完成！${done.length} 件精品農產已存入倉庫！`;
  }
}
