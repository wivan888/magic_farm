import {
  CROPS,
  ANIMALS,
  GOODS_CATALOG,
  RECIPES,
  MUTATIONS,
  BUILDING_CATALOG,
  AUTOMATION_CONFIG,
  getCropById,
  getAnimalSpec,
  getBuildingSpec
} from '../systems/GameData.js';
import { ACHIEVEMENTS } from '../systems/AchievementSystem.js';
import { FISH_CATALOG } from '../systems/FishingSystem.js';
import { TECH_TREE } from '../systems/ResearchSystem.js';
import { WORLD_WONDERS } from '../systems/WonderSystem.js';
import { OUTFIT_CATALOG } from '../systems/ExpoSystem.js';

export class HUDManager {
  constructor(root, deps) {
    this.root = root;
    this.sm = deps.stateManager;
    this.weather = deps.weatherSystem;
    this.season = deps.seasonSystem;
    this.market = deps.marketSystem;
    this.farming = deps.farmingManager;
    this.buildings = deps.buildingManager;
    this.automation = deps.automationSystem;
    this.animals = deps.animalManager;
    this.processing = deps.processingSystem;
    this.achievements = deps.achievementSystem;
    this.fishing = deps.fishingSystem;
    this.logistics = deps.logisticsSystem;
    this.research = deps.researchSystem;
    this.orders = deps.townOrderSystem;
    this.wonders = deps.wonderSystem;
    this.expo = deps.expoSystem;
    this.network = deps.network;
    this.toastTimer = null;

    if (!this.sm.state.playerName) {
      this.sm.state.playerName = `農夫_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    this.mountHTML();
    this.bindEvents();
  }

  mountHTML() {
    this.root.innerHTML = `
      <div class="hud-top">
        <div class="hud-group">
          <div class="pill logo-pill">🌈 Dream Farm V10.0</div>
          <div class="pill">🪙 <span id="coins">900</span></div>
          <div class="pill">⭐ Lv.<span id="level">1</span> (<span id="xp">0</span>/<span id="xpneed">100</span>)</div>
          <div class="pill" id="repPill">🌱 名聲 0</div>
          <div class="pill">🎒 <span id="invcount">0</span>/<span id="invcap">20</span></div>
          <div class="pill" id="netStatusPill">🔴 單機</div>
        </div>
        <div class="hud-group">
          <div class="pill" id="seasonPill">🌸 春季</div>
          <div class="pill" id="eventPill">🌿 平常日</div>
          <div class="pill" id="weatherPill">☀️ 晴朗</div>
        </div>
      </div>

      <div class="drawer-toggle">
        <button class="btn-yellow" data-panel="seedPanel">🌰 種子</button>
        <button class="btn-green" data-panel="bagPanel">🎒 背包</button>
        <button class="btn-orange" data-panel="orderPanel">📜 鎮民委託</button>
        <button class="btn-pink" data-panel="expoPanel">🎪 博覽會/換裝</button>
        <button class="btn-purple" data-panel="techPanel">🔬 科技樹</button>
        <button class="btn-blue" data-panel="fishPanel">🎣 釣魚</button>
        <button class="btn-pink" data-panel="animalPanel">🐄 牧場</button>
        <button class="btn-teal" data-panel="factoryPanel">🏭 加工</button>
        <button class="btn-blue" data-panel="marketPanel">🛒 市場</button>
        <button class="btn-purple" data-panel="autoPanel">⚙️ 自動/物流</button>
        <button class="btn-orange" data-panel="buildPanel">🏗️ 建造/奇觀</button>
        <button class="btn-yellow" data-panel="codexPanel">🏆 圖鑑</button>
        <button class="btn-blue" data-panel="socialPanel">🌐 公會/社群</button>
        <button class="btn-gray" data-panel="upgradePanel">🛠️ 升級</button>
      </div>

      <div class="build-banner" id="buildBanner">
        <span id="buildBannerText">🏗️ 建造模式中</span>
        <button class="btn-yellow" id="rotateBuildBtn" style="padding:4px 9px;font-size:12px">旋轉 [R]</button>
        <button class="btn-red" id="exitBuildBtn" style="padding:4px 9px;font-size:12px">退出 [ESC]</button>
      </div>

      <div class="build-banner" id="visitBanner" style="background:#1c7ed6;border-color:#a5d8ff">
        <span id="visitBannerText">🏡 正在拜訪好友農場</span>
        <button class="btn-yellow" id="helpWaterBtn" style="padding:4px 9px;font-size:12px">💧 互助澆水 (+25🪙)</button>
        <button class="btn-red" id="leaveVisitBtn" style="padding:4px 9px;font-size:12px">返回自己農場</button>
      </div>

      <div class="panel" id="seedPanel">
        <h3><span>🌰 選擇種子</span><button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button></h3>
        <div class="grid-2" id="seedList"></div>
      </div>

      <div class="panel" id="bagPanel">
        <h3>
          <span>🎒 作物與倉庫</span>
          <div style="display:flex;gap:5px">
            <button class="btn-yellow" id="sellAllBtn" style="padding:4px 9px;font-size:12px">💰 全賣 (<span id="sellAllVal">0</span>)</button>
            <button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button>
          </div>
        </h3>
        <div id="goodsBagSection"></div>
        <div id="inventoryList"></div>
      </div>

      <div class="panel" id="orderPanel">
        <h3>
          <span>📜 小鎮居民委託布告欄</span>
          <div style="display:flex;gap:5px">
            <button class="btn-blue" id="refreshOrdersBtn" style="padding:4px 9px;font-size:12px">🔄 刷新 (30🪙)</button>
            <button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button>
          </div>
        </h3>
        <div id="repBannerNote" style="font-size:12px;font-weight:800;background:#fff4e6;padding:8px;border-radius:10px;margin-bottom:8px"></div>
        <div id="townOrderList"></div>
      </div>

      <div class="panel" id="expoPanel">
        <h3><span>🎪 年度農場博覽會與農夫衣櫥</span><button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button></h3>
        <div class="card" style="margin-bottom:10px;background:#fff0f6">
          <b>🏆 農場綜合實力評比大賽</b>
          <small id="expoScoreBreakdown"></small>
          <small id="expoBestRecord" style="color:#a61e4d;margin-top:3px"></small>
          <button class="btn-pink" id="enterExpoBtn" style="margin-top:6px;width:100%">🎪 立即報名博覽會評比</button>
        </div>
        <h3 style="font-size:14px"><span>👔 農夫造型衣櫥（3D 即時換裝）</span></h3>
        <div id="outfitList"></div>
      </div>

      <div class="panel" id="techPanel">
        <h3><span>🔬 農業科技研究所</span><button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button></h3>
        <div id="techTreeList"></div>
      </div>

      <div class="panel" id="fishPanel">
        <h3>
          <span>🎣 農場生態釣魚池塘</span>
          <div style="display:flex;gap:5px">
            <button class="btn-yellow" id="sellAllFishBtn" style="padding:4px 9px;font-size:12px">💰 賣出全部漁獲</button>
            <button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button>
          </div>
        </h3>
        <div class="card" style="margin-bottom:8px">
          <b>🐟 拋竿垂釣（魚餌 15 🪙）</b>
          <small>池塘可釣獲：${FISH_CATALOG.map(f => `${f.e}${f.name}(${f.rarity})`).join('、')}</small>
          <button class="btn-blue" id="castFishBtn" style="margin-top:6px;width:100%">🎣 立即拋竿釣魚 (15 🪙)</button>
        </div>
        <div id="fishBagList"></div>
      </div>

      <div class="panel" id="animalPanel">
        <h3><span>🐄 牧場動物養殖</span><button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button></h3>
        <div id="animalCapNote" style="font-size:11.5px;background:#fff0f6;padding:7px 9px;border-radius:10px;margin-bottom:8px;font-weight:700"></div>
        <div class="grid-2" id="animalShopList" style="margin-bottom:10px"></div>
        <h3 style="font-size:14px"><span>🐾 我的動物</span></h3>
        <div id="myAnimalList"></div>
      </div>

      <div class="panel" id="factoryPanel">
        <h3><span>🏭 農產品加工工坊</span><button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button></h3>
        <div id="factoryStatusNote" style="font-size:11.5px;background:#e6fcf5;padding:7px 9px;border-radius:10px;margin-bottom:8px;font-weight:700"></div>
        <div id="processingQueueList" style="margin-bottom:8px"></div>
        <div id="recipeList"></div>
      </div>

      <div class="panel" id="marketPanel">
        <h3><span>🛒 今日系統市場行情</span><button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button></h3>
        <div id="marketNote" style="font-size:12px;font-weight:700;background:#eff7dd;padding:8px;border-radius:10px;margin-bottom:8px"></div>
        <div class="grid-2" id="marketList"></div>
      </div>

      <div class="panel" id="autoPanel">
        <h3>
          <span>⚙️ 自動化與物流倉庫</span>
          <div style="display:flex;gap:5px">
            <button class="btn-blue" id="toggleAutoBtn" style="padding:4px 9px;font-size:12px">運行中</button>
            <button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button>
          </div>
        </h3>
        <div class="card" style="margin-bottom:8px;background:#f3f0ff">
          <b>🚚 自動化物流無人機倉庫 (Lv.<span id="logiLevel">0</span>/5)</b>
          <small id="logiDesc">背包達 85% 容量時自動轉運出貨，並享物流溢價加成！</small>
          <button class="btn-teal" id="upgradeLogiBtn" style="margin-top:6px;width:100%">啟用 / 升級物流倉庫</button>
        </div>
        <div id="autoList"></div>
      </div>

      <div class="panel" id="buildPanel">
        <h3><span>🏗️ 建築、裝飾與世界奇觀</span><button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button></h3>
        <h3 style="font-size:13.5px;margin:4px 0"><span>🏛️ 農場世界奇觀（永久強效光環）</span></h3>
        <div id="wonderCatalogList" style="margin-bottom:10px"></div>
        <h3 style="font-size:13.5px;margin:4px 0"><span>🏠 一般農場建築</span></h3>
        <div class="grid-2" id="buildCatalogList" style="margin-bottom:10px"></div>
        <h3 style="font-size:13.5px;margin-top:8px"><span>📋 已建造清單</span></h3>
        <div id="placedBuildingList"></div>
      </div>

      <div class="panel" id="codexPanel">
        <h3><span>🏆 農場成就與全圖鑑</span><button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button></h3>
        <div id="codexProgressNote" style="font-size:12px;font-weight:800;background:#fff9db;padding:8px;border-radius:10px;margin-bottom:8px"></div>
        <div id="codexGrid" style="margin-bottom:10px"></div>
        <h3 style="font-size:14px"><span>🎖️ 里程碑成就</span></h3>
        <div id="achievementList"></div>
      </div>

      <div class="panel" id="socialPanel">
        <h3><span>🌐 公會合作社、大訂單與社群</span><button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button></h3>
        <div class="card" style="margin-bottom:8px">
          <b>🪪 我的農夫稱號</b>
          <div style="display:flex;gap:5px;margin-top:5px">
            <input id="playerNameInput" type="text" maxlength="14" style="flex:1;padding:5px 8px;border:2px solid #ddd;border-radius:8px;font-weight:700" />
            <button class="btn-green" id="saveNameBtn" style="padding:5px 10px;font-size:12px">更新</button>
          </div>
        </div>

        <h3 style="font-size:13.5px;margin:6px 0"><span>🚢 跨服聯合商船大訂單</span></h3>
        <div class="card" style="margin-bottom:8px;background:#e7f5ff" id="globalCargoCard"></div>

        <h3 style="font-size:13.5px;margin:6px 0"><span>🤝 農夫公會合作社</span></h3>
        <div id="guildSection" style="margin-bottom:8px"></div>

        <h3 style="font-size:13.5px;margin:6px 0"><span>👑 賽季農場積分排行榜</span></h3>
        <div id="leaderboardList" style="margin-bottom:8px"></div>
        <h3 style="font-size:13.5px;margin:6px 0"><span>👥 在線農夫</span></h3>
        <div id="onlinePlayersList" style="margin-bottom:8px"></div>
        <h3 style="font-size:13.5px;margin:6px 0"><span>🏛️ 玩家自由拍賣行</span></h3>
        <div id="playerMarketList" style="margin-bottom:8px"></div>
        <h3 style="font-size:13.5px;margin:6px 0"><span>💬 世界農夫頻道</span></h3>
        <div id="chatBox" style="background:#fff;border:2px solid #e5dec3;border-radius:10px;padding:6px 8px;height:80px;overflow-y:auto;font-size:11.5px;margin-bottom:6px"></div>
        <div style="display:flex;gap:5px">
          <input id="chatInput" type="text" placeholder="輸入聊天訊息..." style="flex:1;padding:5px 8px;border:2px solid #ddd;border-radius:8px;font-size:12px" />
          <button class="btn-blue" id="sendChatBtn" style="padding:5px 10px;font-size:12px">發送</button>
        </div>
      </div>

      <div class="panel" id="upgradePanel">
        <h3><span>🛠️ 農場升級與夥伴</span><button class="btn-gray close-panel" style="padding:3px 8px;font-size:12px">✕</button></h3>
        <div class="grid-2" id="upgradeList" style="margin-bottom:10px"></div>
        <div class="card" style="margin-bottom:8px">
          <b>🐾 跟隨寵物：小雞</b>
          <small>收成時有 20% 機率撿到額外金幣</small>
          <button class="btn-yellow" id="petBtn" style="margin-top:6px;width:100%">領養小雞 (250 🪙)</button>
        </div>
        <div class="card" style="margin-bottom:8px">
          <b>🎯 每日任務</b>
          <small id="questInfo"></small>
        </div>
        <button class="btn-red" id="resetBtn" style="width:100%;font-size:12px">重置存檔</button>
      </div>

      <div class="hud-bottom">
        <div class="target-card" id="targetInfo">移動到農地旁或點擊地塊進行互動</div>
        <div class="action-bar">
          <button class="btn-green" id="btnPlant">🌱 種植 [E]</button>
          <button class="btn-yellow" id="btnHarvest">🧺 收成 [E]</button>
          <button class="btn-blue" id="btnWater">💧 澆水 [F]</button>
          <button class="btn-gray" id="btnClear">🧹 清除</button>
        </div>
      </div>

      <div class="toast" id="toast"></div>
      <div class="modal-bg" id="modalBg">
        <div class="modal">
          <h2 id="modalTitle">🎉 恭喜！</h2>
          <p id="modalBody" style="font-weight:700;line-height:1.5"></p>
          <button class="btn-green" id="closeModalBtn">繼續經營</button>
        </div>
      </div>
    `;
    this.$('playerNameInput').value = this.sm.state.playerName || '';
  }

  $(id) { return this.root.querySelector(`#${id}`); }

  bindEvents() {
    this.root.querySelectorAll('[data-panel]').forEach(btn => btn.addEventListener('click', () => this.togglePanel(btn.dataset.panel)));
    this.root.querySelectorAll('.close-panel').forEach(btn => btn.addEventListener('click', () => this.root.querySelectorAll('.panel').forEach(p => p.classList.remove('active'))));
    this.$('btnPlant').addEventListener('click', () => this.handlePlant());
    this.$('btnHarvest').addEventListener('click', () => this.handleHarvest());
    this.$('btnWater').addEventListener('click', () => this.handleWater());
    this.$('btnClear').addEventListener('click', () => this.handleClear());
    this.$('sellAllBtn').addEventListener('click', () => this.handleSellAll());
    this.$('refreshOrdersBtn').addEventListener('click', () => { const res = this.orders.refreshOrders(); this.showToast(res.msg); this.render(); });
    this.$('enterExpoBtn').addEventListener('click', () => { const res = this.expo.enterExpo(); this.showToast(res.msg); this.render(); });
    this.$('castFishBtn').addEventListener('click', () => {
      const mult = this.season.getCurrentSeason().priceMult * this.research.getSellMultiplier();
      const res = this.fishing.castLine(mult);
      this.showToast(res.msg);
      this.render();
    });
    this.$('sellAllFishBtn').addEventListener('click', () => { const res = this.fishing.sellAllFish(); this.showToast(res.msg); this.render(); });
    this.$('upgradeLogiBtn').addEventListener('click', () => { const res = this.logistics.upgrade(); this.showToast(res.msg); this.render(); });
    this.$('petBtn').addEventListener('click', () => this.handleAdoptPet());
    this.$('resetBtn').addEventListener('click', () => this.handleReset());
    this.$('toggleAutoBtn').addEventListener('click', () => { this.automation.toggleEnabled(); this.render(); });
    this.$('rotateBuildBtn').addEventListener('click', () => this.buildings.rotatePreview());
    this.$('exitBuildBtn').addEventListener('click', () => { this.buildings.exitBuildMode(); this.render(); });
    this.$('helpWaterBtn').addEventListener('click', () => this.network.helpWaterVisitedFarm());
    this.$('leaveVisitBtn').addEventListener('click', () => this.network.leaveVisit());
    this.$('saveNameBtn').addEventListener('click', () => {
      const val = this.$('playerNameInput').value.trim();
      if (val) { this.sm.state.playerName = val; this.network.syncMyState(); this.showToast(`🪪 農夫稱號已更新為「${val}」`); this.render(); }
    });
    this.$('sendChatBtn').addEventListener('click', () => { const input = this.$('chatInput'); if (input.value.trim()) { this.network.sendChat(input.value); input.value = ''; } });
    this.$('chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.$('sendChatBtn').click(); });
    this.$('closeModalBtn').addEventListener('click', () => this.$('modalBg').classList.remove('show'));
  }

  togglePanel(id) {
    const target = this.$(id);
    const wasActive = target.classList.contains('active');
    this.root.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    if (!wasActive) target.classList.add('active');
  }

  showToast(msg) {
    const el = this.$('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), 2300);
  }

  showModal(title, body) {
    this.$('modalTitle').textContent = title;
    this.$('modalBody').textContent = body;
    this.$('modalBg').classList.add('show');
  }

  getTotalPriceMultiplier() {
    const evMult = this.network.globalEvent?.bonusType === 'gold' ? 1.25 : 1.0;
    return this.weather.getPriceMultiplier()
      * evMult
      * this.season.getCurrentSeason().priceMult
      * this.research.getSellMultiplier()
      * this.orders.getReputationRank().bonusMult
      * this.wonders.getSellMultiplier()
      * this.expo.getOutfitSellMultiplier()
      * this.network.getGuildBonusMultiplier();
  }

  handlePlant() {
    const S = this.sm.state;
    const idx = S.selectedPlot;
    const c = getCropById(S.seed);
    if (S.plots[idx]) return this.showToast('這塊土地已經有作物了！');
    if (S.coins < c.cost) return this.showToast('金幣不足！');
    S.coins -= c.cost;
    const muts = this.farming.rollMutations();
    const extraChance = this.research.getExtraMutationChance() + this.wonders.getExtraMutationChance() + (this.network.globalEvent?.bonusType === 'mutation' ? 0.25 : 0);
    if (muts.length === 0 && Math.random() < extraChance) {
      const m = MUTATIONS[Math.floor(Math.random() * MUTATIONS.length)];
      if (m) muts.push(m.name);
    }
    const growthMult = this.sm.getGrowthSpeedMultiplier() * this.season.getCurrentSeason().growthMult * this.research.getGrowthMultiplier() * this.wonders.getGrowthMultiplier();
    S.plots[idx] = { id: c.id, at: Date.now(), time: c.time * growthMult, muts };
    this.showToast(`🌱 在第 ${idx + 1} 塊地種下 ${c.name}！`);
    this.render();
  }

  handleHarvest() {
    const S = this.sm.state;
    const idx = S.selectedPlot;
    const p = S.plots[idx];
    if (!p || !this.farming.isMature(p)) return;
    const maxCap = this.sm.getMaxInventoryCapacity();
    if (S.inventory.length >= maxCap) return this.showToast(`🎒 背包已滿（${maxCap}格）！`);
    const c = getCropById(p.id);
    const muts = p.muts || [];
    let weightFactor = (0.55 + Math.random() * 0.50) * this.research.getWeightMultiplier();
    for (const mName of muts) { const m = MUTATIONS.find(x => x.name === mName); if (m && m.w) weightFactor *= m.w; }
    const actualWeight = Number((c.maxWeight * weightFactor).toFixed(2));
    S.inventory.unshift({ uid: Date.now() + Math.random(), cropId: c.id, weight: actualWeight, muts });
    this.achievements.recordCrop(c.id, muts);
    S.harvests++;
    const xpMult = (this.network.globalEvent?.bonusType === 'xp' ? 1.5 : 1.0) * (this.wonders.hasWonder('solar_obelisk') ? 1.15 : 1.0);
    this.sm.addXp(Math.round(c.xp * xpMult), lvl => this.showModal('🎉 農場升級！', `恭喜升到 Lv.${lvl}！獲得 120 金幣！`));
    S.plots[idx] = null;
    this.showToast(`🧺 收成 ${c.name} (${actualWeight}kg) 存入背包！`);
    this.render();
  }

  handleWater() {
    const p = this.sm.getSelectedPlot();
    if (!p || this.farming.isMature(p)) return;
    const wellMult = (this.buildings.hasBuilding('well') ? 1.5 : 1.0) * (1 + this.research.getLevel('hydroponics') * 0.15);
    p.at -= Math.min(8, p.time * 0.25) * 1000 * wellMult;
    this.showToast('💧 澆水成功，作物加速成長！');
    this.render();
  }

  handleClear() { if (this.sm.state.plots[this.sm.state.selectedPlot]) { this.sm.state.plots[this.sm.state.selectedPlot] = null; this.showToast('🧹 已清除土地上的作物'); this.render(); } }

  handleSellItem(idx) {
    const S = this.sm.state;
    const item = S.inventory[idx];
    if (!item) return;
    const price = Math.round(this.market.calculateItemPrice(item, 1) * this.getTotalPriceMultiplier());
    S.coins += price;
    S.inventory.splice(idx, 1);
    this.showToast(`💰 賣出 ${item.weight}kg ${getCropById(item.cropId).name}，獲得 ${price} 🪙！`);
    this.render();
  }

  handleSellGood(goodId, count = 1) {
    const S = this.sm.state;
    if (((S.goodsBag || {})[goodId] || 0) < count) return;
    const unitPrice = Math.round(this.market.calculateGoodPrice(goodId, 1) * this.getTotalPriceMultiplier());
    S.goodsBag[goodId] -= count;
    S.coins += unitPrice * count;
    this.showToast(`💰 賣出 ${GOODS_CATALOG[goodId]?.name} ×${count}，獲得 ${unitPrice * count} 🪙！`);
    this.render();
  }

  handleSellAll() {
    const S = this.sm.state;
    const mult = this.getTotalPriceMultiplier();
    let total = S.inventory.reduce((sum, item) => sum + Math.round(this.market.calculateItemPrice(item, 1) * mult), 0);
    S.inventory = [];
    Object.entries(S.goodsBag || {}).forEach(([goodId, qty]) => { if (qty > 0) { total += Math.round(this.market.calculateGoodPrice(goodId, 1) * mult) * qty; S.goodsBag[goodId] = 0; } });
    if (total <= 0) return;
    S.coins += total;
    this.showToast(`💰 全部出售完成，共獲得 ${total} 🪙！`);
    this.render();
  }

  handleBuyUpgrade(type) {
    const S = this.sm.state;
    const cost = type === 'speed' ? 180 : type === 'fert' ? 220 : 500;
    if (S.coins < cost) return this.showToast('金幣不足！');
    S.coins -= cost;
    if (type === 'speed') { S.speed = true; S.plots.forEach(p => { if (p) p.time *= 0.85; }); }
    else if (type === 'fert') S.fertilizer = true;
    else if (type === 'land' && S.plots.length < 18) { S.extra = true; S.plots.push(null, null, null); this.farming.rebuildPlots(); }
    this.showToast('🛠️ 農場升級成功！');
    this.render();
  }

  handleAdoptPet() {
    const S = this.sm.state;
    if (S.pet || S.coins < 250) return;
    S.coins -= 250;
    S.pet = true;
    this.showToast('🐥 小雞加入你的 3D 農場了！');
    this.render();
  }

  handleReset() {
    if (confirm('確定要清除存檔並重新開始嗎？')) {
      this.sm.reset();
      this.buildings.exitBuildMode();
      this.farming.rebuildPlots();
      this.buildings.rebuildAllBuildings();
      this.animals.rebuildAnimals();
      this.automation.syncVisuals();
      this.weather.applyVisuals();
      this.season.applyVisuals();
      this.expo.applyOutfitVisuals();
      this.render();
    }
  }

  render() {
    const S = this.sm.state;
    const maxCap = this.sm.getMaxInventoryCapacity();
    const rank = this.orders.getReputationRank();
    this.$('coins').textContent = Math.floor(S.coins);
    this.$('level').textContent = S.level;
    this.$('xp').textContent = S.xp;
    this.$('xpneed').textContent = S.level * 100;
    this.$('repPill').textContent = `${rank.badge} 名聲 ${S.reputation || 0}`;
    this.$('invcount').textContent = S.inventory.length;
    this.$('invcap').textContent = maxCap;
    this.$('netStatusPill').textContent = this.network.connected ? `🟢 ${this.network.players.length}人在線` : '🔴 單機';

    const curSeason = this.season.getCurrentSeason();
    const sRem = Math.max(0, curSeason.duration - (S.seasonElapsed || 0));
    this.$('seasonPill').textContent = `${curSeason.e} ${curSeason.name.split('・')[0]} (${sRem}s)`;
    this.$('eventPill').textContent = `${this.network.globalEvent.e} ${this.network.globalEvent.name}`;
    const w = this.weather.getCurrentWeather();
    this.$('weatherPill').textContent = `${w.e} ${w.name}`;

    const banner = this.$('buildBanner');
    if (this.buildings.buildModeType) {
      const spec = getBuildingSpec(this.buildings.buildModeType);
      banner.classList.add('active');
      this.$('buildBannerText').textContent = `🏗️ 正在放置：${spec.e} ${spec.name} (${spec.cost} 🪙)`;
    } else banner.classList.remove('active');

    const visitBanner = this.$('visitBanner');
    if (this.network.visitingFarm) {
      visitBanner.classList.add('active');
      this.$('visitBannerText').textContent = `🏡 正在拜訪「${this.network.visitingFarm.name}」的農場 (Lv.${this.network.visitingFarm.level})`;
    } else visitBanner.classList.remove('active');

    const p = S.plots[S.selectedPlot];
    const curSeed = getCropById(S.seed);
    if (!p) {
      this.$('targetInfo').innerHTML = `📍 第 <b>${S.selectedPlot + 1}</b> 號空地 ｜ 種子：<b>${curSeed.e} ${curSeed.name}</b> (${curSeed.cost} 🪙)`;
    } else {
      const c = getCropById(p.id);
      const remain = Math.max(0, Math.ceil(p.time - (Date.now() - p.at) / 1000));
      const mutStr = p.muts?.length ? `【${p.muts.join('＋')}】` : '';
      this.$('targetInfo').innerHTML = `📍 第 <b>${S.selectedPlot + 1}</b> 號地：<b>${c.e} ${mutStr}${c.name}</b> ｜ ${remain === 0 ? '<span style="color:#2b8a3e">✨ 已成熟可收成！</span>' : `剩餘 ${remain} 秒`}`;
    }

    this.$('btnPlant').disabled = !!p;
    this.$('btnHarvest').disabled = !this.farming.isMature(p);
    this.$('btnWater').disabled = !p || this.farming.isMature(p);
    this.$('btnClear').disabled = !p;

    const seedList = this.$('seedList');
    seedList.innerHTML = '';
    CROPS.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'card ' + (S.seed === c.id ? 'selected' : '');
      btn.disabled = S.level < c.level;
      btn.innerHTML = `<b>${c.e} ${c.name}</b><small>${c.cost} 🪙 · ${c.time}秒 · Lv.${c.level}</small>`;
      btn.onclick = () => { S.seed = c.id; this.render(); };
      seedList.appendChild(btn);
    });

    const mult = this.getTotalPriceMultiplier();
    let totalSell = 0;
    const goodsSec = this.$('goodsBagSection');
    goodsSec.innerHTML = '';
    const ownedGoods = Object.entries(S.goodsBag || {}).filter(([, qty]) => qty > 0);
    ownedGoods.forEach(([goodId, qty]) => {
      const spec = GOODS_CATALOG[goodId];
      if (!spec) return;
      const unitPrice = Math.round(this.market.calculateGoodPrice(goodId, 1) * mult);
      totalSell += unitPrice * qty;
      const row = document.createElement('div');
      row.className = 'inv-item';
      row.innerHTML = `<div><b>${spec.e} ${spec.name}</b> <span class="tag">×${qty}</span></div><div style="display:flex;gap:4px"></div>`;
      const box = row.lastElementChild;
      const sellBtn = document.createElement('button');
      sellBtn.className = 'btn-teal'; sellBtn.style.cssText = 'padding:5px 8px;font-size:11px'; sellBtn.textContent = `賣1 (${unitPrice}🪙)`;
      sellBtn.onclick = () => this.handleSellGood(goodId, 1);
      const listBtn = document.createElement('button');
      listBtn.className = 'btn-blue'; listBtn.style.cssText = 'padding:5px 8px;font-size:11px'; listBtn.textContent = '上架';
      listBtn.onclick = () => { S.goodsBag[goodId] -= 1; this.network.createListing('good', { goodId, qty: 1 }, `${spec.e} ${spec.name}`, Math.round(unitPrice * 1.25)); this.render(); };
      box.append(sellBtn, listBtn);
      goodsSec.appendChild(row);
    });

    const invEl = this.$('inventoryList');
    invEl.innerHTML = '';
    if (!S.inventory.length && !ownedGoods.length) {
      invEl.innerHTML = '<div style="text-align:center;color:#777;font-size:13px;padding:16px">背包目前是空的！</div>';
    } else {
      S.inventory.forEach((item, idx) => {
        const c = getCropById(item.cropId);
        const price = Math.round(this.market.calculateItemPrice(item, 1) * mult);
        totalSell += price;
        const tags = item.muts.map(m => `<span class="tag">${m}</span>`).join('');
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.innerHTML = `<div><b>${c.e} ${c.name}</b> ${tags}<div style="font-size:11px;color:#666">${item.weight.toFixed(2)} kg</div></div><div style="display:flex;gap:4px"></div>`;
        const box = div.lastElementChild;
        const sellBtn = document.createElement('button');
        sellBtn.className = 'btn-green'; sellBtn.style.cssText = 'padding:5px 8px;font-size:11px'; sellBtn.textContent = `賣 ${price}🪙`;
        sellBtn.onclick = () => this.handleSellItem(idx);
        const listBtn = document.createElement('button');
        listBtn.className = 'btn-blue'; listBtn.style.cssText = 'padding:5px 8px;font-size:11px'; listBtn.textContent = '上架';
        listBtn.onclick = () => { const [removed] = S.inventory.splice(idx, 1); this.network.createListing('crop', removed, `${c.e} ${c.name} (${removed.weight}kg)`, Math.round(price * 1.25)); this.render(); };
        box.append(sellBtn, listBtn);
        invEl.appendChild(div);
      });
    }
    this.$('sellAllVal').textContent = totalSell;
    this.$('sellAllBtn').disabled = totalSell <= 0;

    this.$('repBannerNote').textContent = `${rank.badge} 當前頭銜：【${rank.title}】（名聲 ${S.reputation || 0}｜全農場售價加成 ×${rank.bonusMult.toFixed(2)}）`;
    const orderEl = this.$('townOrderList');
    orderEl.innerHTML = '';
    (S.townOrders || []).forEach(ord => {
      const ready = this.orders.canFulfill(ord);
      const card = document.createElement('div');
      card.className = 'card'; card.style.marginBottom = '8px';
      card.innerHTML = `<b>${ord.npcEmoji} ${ord.npcName}</b><small>需求：<b>${ord.label}</b> ｜ 報酬：<b>${ord.rewardCoins} 🪙</b> + ${ord.rewardRep} 名聲 + ${ord.rewardXp} XP</small>`;
      const btn = document.createElement('button');
      btn.className = ready ? 'btn-green' : 'btn-gray'; btn.style.cssText = 'margin-top:6px;width:100%'; btn.disabled = !ready;
      btn.textContent = ready ? '📦 立即交付委託' : '庫存尚未齊全';
      btn.onclick = () => { const res = this.orders.fulfillOrder(ord.id, this.research.getLevel('gourmet_craft')); this.showToast(res.msg); this.render(); };
      card.appendChild(btn);
      orderEl.appendChild(card);
    });

    const evalData = this.expo.evaluateFarmScore();
    this.$('expoScoreBreakdown').textContent = `當前預估總分：${evalData.total} 分（等級 ${evalData.breakdown.levelPts} + 建築 ${evalData.breakdown.buildingPts} + 牧場 ${evalData.breakdown.animalPts} + 圖鑑 ${evalData.breakdown.codexPts} + 奇觀 ${evalData.breakdown.wonderPts}）`;
    this.$('expoBestRecord').textContent = `歷史最高紀錄：${S.expoRecord?.bestScore || 0} 分（${S.expoRecord?.bestRank || '尚未參賽'}）`;

    const outfitEl = this.$('outfitList');
    outfitEl.innerHTML = '';
    const unlockedOutfits = new Set(S.unlockedOutfits || ['classic']);
    OUTFIT_CATALOG.forEach(o => {
      const isEquipped = S.currentOutfit === o.id;
      const isOwned = unlockedOutfits.has(o.id);
      const card = document.createElement('div');
      card.className = 'card ' + (isEquipped ? 'selected' : ''); card.style.marginBottom = '7px';
      card.innerHTML = `<b>${o.e} ${o.name}</b><small>${o.desc}</small>`;
      const btn = document.createElement('button');
      btn.className = isEquipped ? 'btn-gray' : isOwned ? 'btn-green' : 'btn-yellow';
      btn.style.cssText = 'margin-top:5px;width:100%'; btn.disabled = isEquipped;
      btn.textContent = isEquipped ? '✅ 穿著中' : isOwned ? '👔 立即換裝' : `🛍️ 解鎖並換裝 (${o.cost} 🪙)`;
      btn.onclick = () => { const res = this.expo.selectOrBuyOutfit(o.id); this.showToast(res.msg); this.render(); };
      card.appendChild(btn);
      outfitEl.appendChild(card);
    });

    const techEl = this.$('techTreeList');
    techEl.innerHTML = '';
    TECH_TREE.forEach(t => {
      const lv = this.research.getLevel(t.id);
      const cost = this.research.getUpgradeCost(t.id);
      const card = document.createElement('div');
      card.className = 'card'; card.style.marginBottom = '8px';
      card.innerHTML = `<b>${t.e} ${t.name} (Lv.${lv}/${t.maxLv})</b><small>${t.desc}</small>`;
      const btn = document.createElement('button');
      btn.className = 'btn-purple'; btn.style.cssText = 'margin-top:6px;width:100%'; btn.disabled = cost === null;
      btn.textContent = cost === null ? '✅ 已達最高科技等級' : `🔬 投入研發 (${cost} 🪙)`;
      btn.onclick = () => { const res = this.research.research(t.id); this.showToast(res.msg); this.render(); };
      card.appendChild(btn);
      techEl.appendChild(card);
    });

    const fishListEl = this.$('fishBagList');
    fishListEl.innerHTML = '';
    const fishBag = S.fishBag || [];
    if (!fishBag.length) {
      fishListEl.innerHTML = '<div style="text-align:center;color:#777;font-size:12px;padding:12px">魚簍目前是空的，點擊上方拋竿試試手氣！</div>';
    } else {
      fishBag.forEach((f, idx) => {
        const row = document.createElement('div');
        row.className = 'inv-item';
        row.innerHTML = `<div><b>${f.e} ${f.name}</b> <span class="tag">${f.rarity}</span><div style="font-size:11px;color:#666">${f.weight} kg</div></div>`;
        const sBtn = document.createElement('button');
        sBtn.className = 'btn-green'; sBtn.style.cssText = 'padding:5px 8px;font-size:11px'; sBtn.textContent = `賣 ${f.price}🪙`;
        sBtn.onclick = () => { S.coins += f.price; S.fishBag.splice(idx, 1); this.showToast(`🐟 賣出 ${f.name}，獲得 ${f.price} 🪙！`); this.render(); };
        row.appendChild(sBtn);
        fishListEl.appendChild(row);
      });
    }

    const smallCount = (S.animals || []).filter(a => getAnimalSpec(a.type)?.housing === 'coop').length;
    const largeCount = (S.animals || []).filter(a => getAnimalSpec(a.type)?.housing === 'barn').length;
    this.$('animalCapNote').textContent = `小型(雞/兔)：${smallCount}/${this.sm.getAnimalCapacity('coop')} ｜ 大型(羊/牛/豬)：${largeCount}/${this.sm.getAnimalCapacity('barn')}`;

    const animalShopEl = this.$('animalShopList');
    animalShopEl.innerHTML = '';
    ANIMALS.forEach(spec => {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.innerHTML = `<b>${spec.e} ${spec.name}</b><small>${spec.cost} 🪙 · ${spec.productEmoji}${spec.productName}</small>`;
      btn.onclick = () => { const res = this.animals.buyAnimal(spec.id); if (res.ok) this.achievements.recordAnimal(spec.id); this.showToast(res.msg); this.render(); };
      animalShopEl.appendChild(btn);
    });

    const myAnimalEl = this.$('myAnimalList');
    myAnimalEl.innerHTML = '';
    S.animals.forEach(a => {
      const spec = getAnimalSpec(a.type);
      if (!spec) return;
      const ready = this.animals.isProductReady(a);
      const rem = this.animals.getRemainingSeconds(a);
      const row = document.createElement('div');
      row.className = 'inv-item';
      row.innerHTML = `<div><b>${spec.e} ${spec.name}</b> <span class="tag">❤️ ${a.affection || 0}%</span><div style="font-size:11px;color:#666">${ready ? `✨ ${spec.productName} 可收穫` : `倒數 ${rem} 秒`}</div></div><div style="display:flex;gap:4px"></div>`;
      const btnBox = row.lastElementChild;
      const feedBtn = document.createElement('button');
      feedBtn.className = 'btn-blue'; feedBtn.style.cssText = 'padding:5px 8px;font-size:11px'; feedBtn.disabled = a.fedBoost;
      feedBtn.textContent = a.fedBoost ? '已餵食' : `餵食(${spec.feedCost}🪙)`;
      feedBtn.onclick = () => { this.showToast(this.animals.feedAnimal(a.uid).msg); this.render(); };
      const colBtn = document.createElement('button');
      colBtn.className = 'btn-yellow'; colBtn.style.cssText = 'padding:5px 8px;font-size:11px'; colBtn.disabled = !ready; colBtn.textContent = '收穫';
      colBtn.onclick = () => { const res = this.animals.collectProduct(a.uid); if (res.ok) this.achievements.recordGood(spec.productId); this.showToast(res.msg); this.render(); };
      btnBox.append(feedBtn, colBtn);
      myAnimalEl.appendChild(row);
    });

    const fCount = this.processing.getFactoryCount();
    this.$('factoryStatusNote').textContent = fCount > 0 ? `🏭 擁有 ${fCount} 座加工工坊` : '⚠️ 請先建造「加工工坊」';
    const queueEl = this.$('processingQueueList');
    queueEl.innerHTML = '';
    (S.processingQueue || []).forEach(task => {
      const recipe = RECIPES.find(r => r.id === task.recipeId);
      const rem = Math.max(0, Math.ceil(task.duration - (Date.now() - task.startedAt) / 1000));
      const div = document.createElement('div');
      div.className = 'inv-item';
      div.innerHTML = `<span style="font-size:12px"><b>⏳ ${recipe?.e} ${recipe?.name}</b></span><span class="tag">${rem}s</span>`;
      queueEl.appendChild(div);
    });

    const recipeEl = this.$('recipeList');
    recipeEl.innerHTML = '';
    RECIPES.forEach(recipe => {
      const craftable = this.processing.canCraft(recipe);
      const card = document.createElement('div');
      card.className = 'card'; card.style.marginBottom = '7px';
      card.innerHTML = `<b>${recipe.e} ${recipe.name}</b><small>${recipe.desc}</small><small style="color:#2b8a3e">庫存：${this.processing.getIngredientStatusText(recipe)}</small>`;
      const btn = document.createElement('button');
      btn.className = 'btn-teal'; btn.style.cssText = 'margin-top:5px;width:100%'; btn.disabled = !craftable;
      btn.textContent = craftable ? '🏭 開始加工' : '條件未滿足';
      btn.onclick = () => { this.showToast(this.processing.startCraft(recipe.id).msg); this.render(); };
      card.appendChild(btn);
      recipeEl.appendChild(card);
    });

    const marketList = this.$('marketList');
    marketList.innerHTML = '';
    CROPS.filter(c => S.level >= c.level).forEach(c => {
      const rate = this.market.getCropRate(c) * mult;
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `<b>${c.e} ${c.name}</b><small>總倍率 <b>${Math.round(rate * 100)}%</b></small>`;
      marketList.appendChild(div);
    });
    this.$('marketNote').textContent = `市場第 ${S.marketDay + 1} 波行情（含季節、名聲、奇觀、服裝與公會光環）`;

    const logi = S.logistics || { level: 0, totalShippedCoins: 0, totalShippedCount: 0 };
    this.$('logiLevel').textContent = logi.level;
    this.$('logiDesc').textContent = logi.level > 0
      ? `每次自動出貨 ${logi.level} 件（溢價 +${logi.level * 5}%）｜累計營收 ${logi.totalShippedCoins} 🪙`
      : '背包達 85% 容量時自動轉運出貨，並享物流溢價加成！';
    const logiCost = this.logistics.getUpgradeCost();
    const logiBtn = this.$('upgradeLogiBtn');
    logiBtn.disabled = logiCost === null;
    logiBtn.textContent = logiCost === null ? '物流倉庫已滿級' : `升級物流倉庫 (${logiCost} 🪙)`;

    const toggleBtn = this.$('toggleAutoBtn');
    toggleBtn.textContent = S.automation.enabled ? '✅ 運作中' : '⏸️ 已暫停';
    const autoList = this.$('autoList');
    autoList.innerHTML = '';
    Object.values(AUTOMATION_CONFIG).forEach(cfg => {
      const lv = S.automation[cfg.id] || 0;
      const nextCost = this.automation.getUpgradeCost(cfg.id);
      const card = document.createElement('div');
      card.className = 'card'; card.style.marginBottom = '8px';
      card.innerHTML = `<b>${cfg.e} ${cfg.name} (Lv.${lv})</b><small>${cfg.desc}</small>`;
      const btn = document.createElement('button');
      btn.className = 'btn-purple'; btn.style.cssText = 'margin-top:5px;width:100%'; btn.disabled = nextCost === null;
      btn.textContent = nextCost === null ? '已滿級' : `升級 (${nextCost} 🪙)`;
      btn.onclick = () => { this.showToast(this.automation.upgradeMachine(cfg.id).msg); this.render(); };
      card.appendChild(btn);
      autoList.appendChild(card);
    });

    const wonderEl = this.$('wonderCatalogList');
    wonderEl.innerHTML = '';
    WORLD_WONDERS.forEach(wSpec => {
      const built = this.wonders.hasWonder(wSpec.id);
      const card = document.createElement('div');
      card.className = 'card'; card.style.marginBottom = '7px'; card.style.background = built ? '#fff9db' : '#fff';
      card.innerHTML = `<b>${wSpec.e} ${wSpec.name}</b><small>${wSpec.desc}</small>`;
      const btn = document.createElement('button');
      btn.className = built ? 'btn-gray' : 'btn-yellow'; btn.style.cssText = 'margin-top:5px;width:100%'; btn.disabled = built;
      btn.textContent = built ? '✨ 奇觀已矗立於 3D 農場' : `🏛️ 動工建造 (${wSpec.cost} 🪙)`;
      btn.onclick = () => { const res = this.wonders.buildWonder(wSpec.id); this.showToast(res.msg); this.render(); };
      card.appendChild(btn);
      wonderEl.appendChild(card);
    });

    const buildCatEl = this.$('buildCatalogList');
    buildCatEl.innerHTML = '';
    BUILDING_CATALOG.forEach(spec => {
      const btn = document.createElement('button');
      btn.className = 'card ' + (this.buildings.buildModeType === spec.id ? 'selected' : '');
      btn.innerHTML = `<b>${spec.e} ${spec.name}</b><small>${spec.cost} 🪙</small>`;
      btn.onclick = () => { this.buildings.enterBuildMode(spec.id); this.root.querySelectorAll('.panel').forEach(p => p.classList.remove('active')); this.render(); };
      buildCatEl.appendChild(btn);
    });

    const placedEl = this.$('placedBuildingList');
    placedEl.innerHTML = '';
    S.buildings.forEach(b => {
      const spec = getBuildingSpec(b.type);
      const row = document.createElement('div');
      row.className = 'inv-item';
      row.innerHTML = `<span style="font-size:12px"><b>${spec?.e} ${spec?.name}</b> (${b.x},${b.z})</span>`;
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-red'; delBtn.style.cssText = 'padding:4px 8px;font-size:11px'; delBtn.textContent = '拆除';
      delBtn.onclick = () => { this.buildings.removeBuilding(b.uid); this.render(); };
      row.appendChild(delBtn);
      placedEl.appendChild(row);
    });

    const prog = this.achievements.getCodexProgress();
    const codex = S.codex || { crops: [], animals: [], goods: [], mutations: [] };
    this.$('codexProgressNote').textContent = `📖 全圖鑑收集進度：${prog.owned} / ${prog.total} (${prog.percent}%)`;

    const codexGrid = this.$('codexGrid');
    codexGrid.innerHTML = `
      <div class="card" style="margin-bottom:6px"><b>🌱 作物圖鑑 (${codex.crops.length}/${CROPS.length})</b><small>${CROPS.map(c => codex.crops.includes(c.id) ? `${c.e}${c.name}` : '❓').join(' · ')}</small></div>
      <div class="card" style="margin-bottom:6px"><b>🧬 突變圖鑑 (${codex.mutations.length}/${MUTATIONS.length})</b><small>${MUTATIONS.map(m => codex.mutations.includes(m.name) ? `${m.e}${m.name}` : '❓').join(' · ')}</small></div>
      <div class="card"><b>🐾 牧場與加工品 (${codex.animals.length + codex.goods.length}/${ANIMALS.length + Object.keys(GOODS_CATALOG).length})</b><small>${ANIMALS.map(a => codex.animals.includes(a.id) ? a.e : '❓').join(' ')} ｜ ${Object.values(GOODS_CATALOG).map(g => codex.goods.includes(g.id) ? g.e : '❓').join(' ')}</small></div>
    `;

    const achList = this.$('achievementList');
    achList.innerHTML = '';
    const unlockedSet = new Set(S.unlockedAchievements || []);
    ACHIEVEMENTS.forEach(ach => {
      const done = unlockedSet.has(ach.id);
      const row = document.createElement('div');
      row.className = 'inv-item'; row.style.background = done ? '#eeffe8' : '#fff';
      row.innerHTML = `<div><b>${ach.e} ${ach.name}</b><div style="font-size:11px;color:#666">${ach.desc}</div></div><span class="tag">${done ? '✅ 已領獎' : `+${ach.reward}🪙`}</span>`;
      achList.appendChild(row);
    });

    const cargo = this.network.cargoOrder;
    const cargoCard = this.$('globalCargoCard');
    cargoCard.innerHTML = `
      <b>${cargo.title}</b>
      <small>全服裝箱進度：<b>${cargo.currentQty} / ${cargo.targetQty}</b> 件 ｜ 達成全服獎勵：${cargo.rewardCoins} 🪙 + ${cargo.rewardRep} 名聲</small>
      <button class="btn-blue" id="contributeCargoBtn" style="margin-top:6px;width:100%" ${S.inventory.length ? '' : 'disabled'}>🚢 裝箱 1 件背包作物 (立得 35🪙 + 8名聲)</button>
    `;
    cargoCard.querySelector('#contributeCargoBtn').onclick = () => this.network.contributeCargo();

    const guildSec = this.$('guildSection');
    guildSec.innerHTML = '';
    const myGuild = this.network.getMyGuild();
    if (myGuild) {
      const gCard = document.createElement('div');
      gCard.className = 'card'; gCard.style.background = '#f3f0ff';
      gCard.innerHTML = `
        <b>🏛️ 我的公會：${myGuild.name} (Lv.${myGuild.level})</b>
        <small>升級基金：${myGuild.fund} / ${myGuild.level * 1000} 🪙 ｜ 全農場售價光環 +${myGuild.level * 4}%</small>
        <button class="btn-purple" id="donateGuildBtn" style="margin-top:6px;width:100%">💖 捐獻公會基金 150 🪙 (+12 名聲)</button>
      `;
      gCard.querySelector('#donateGuildBtn').onclick = () => this.network.donateGuild(150);
      guildSec.appendChild(gCard);
    } else {
      this.network.guilds.forEach(g => {
        const row = document.createElement('div');
        row.className = 'inv-item';
        row.innerHTML = `<span style="font-size:12px"><b>${g.name}</b> (Lv.${g.level})</span>`;
        const jBtn = document.createElement('button');
        jBtn.className = 'btn-green'; jBtn.style.cssText = 'padding:4px 8px;font-size:11px'; jBtn.textContent = '加入';
        jBtn.onclick = () => this.network.joinGuild(g.id);
        row.appendChild(jBtn);
        guildSec.appendChild(row);
      });
      const createRow = document.createElement('div');
      createRow.style.cssText = 'display:flex;gap:5px;margin-top:5px';
      createRow.innerHTML = `<input id="newGuildInput" type="text" placeholder="新公會名稱..." style="flex:1;padding:5px 8px;border:2px solid #ddd;border-radius:8px;font-size:12px" /><button class="btn-purple" id="createGuildBtn" style="padding:5px 9px;font-size:11.5px">創立(300🪙)</button>`;
      createRow.querySelector('#createGuildBtn').onclick = () => this.network.createGuild(createRow.querySelector('#newGuildInput').value);
      guildSec.appendChild(createRow);
    }

    const lbEl = this.$('leaderboardList');
    lbEl.innerHTML = '';
    if (!this.network.leaderboard.length) {
      lbEl.innerHTML = '<div style="font-size:12px;color:#777">連線至伺服器後顯示即時積分榜</div>';
    } else {
      this.network.leaderboard.forEach((entry, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        const row = document.createElement('div');
        row.className = 'inv-item';
        row.innerHTML = `<span style="font-size:12px"><b>${medal} ${entry.name}</b> (Lv.${entry.level})</span><span class="tag">${entry.score} 分</span>`;
        lbEl.appendChild(row);
      });
    }

    const playersEl = this.$('onlinePlayersList');
    playersEl.innerHTML = '';
    if (!this.network.connected) {
      playersEl.innerHTML = '<div style="font-size:12px;color:#777">尚未連線（請執行 npm run server）</div>';
    } else {
      this.network.players.forEach(pl => {
        const isMe = pl.id === this.network.socket.id;
        const row = document.createElement('div');
        row.className = 'inv-item';
        row.innerHTML = `<span style="font-size:12px"><b>${pl.name}</b> ${isMe ? '(我)' : ''} · Lv.${pl.level}</span>`;
        if (!isMe) {
          const vBtn = document.createElement('button');
          vBtn.className = 'btn-blue'; vBtn.style.cssText = 'padding:4px 8px;font-size:11px'; vBtn.textContent = '拜訪';
          vBtn.onclick = () => this.network.visitPlayer(pl.id);
          row.appendChild(vBtn);
        }
        playersEl.appendChild(row);
      });
    }

    const pMarketEl = this.$('playerMarketList');
    pMarketEl.innerHTML = '';
    if (!this.network.listings.length) {
      pMarketEl.innerHTML = '<div style="font-size:12px;color:#777">目前沒有玩家上架商品</div>';
    } else {
      this.network.listings.forEach(item => {
        const isMine = item.sellerId === this.network.socket.id;
        const row = document.createElement('div');
        row.className = 'inv-item';
        row.innerHTML = `<div style="font-size:12px"><b>${item.label}</b><small style="display:block;color:#666">賣家：${item.sellerName}</small></div>`;
        const buyBtn = document.createElement('button');
        buyBtn.className = isMine ? 'btn-gray' : 'btn-green'; buyBtn.style.cssText = 'padding:4px 8px;font-size:11px'; buyBtn.disabled = isMine;
        buyBtn.textContent = isMine ? `我的 (${item.price}🪙)` : `購買 ${item.price}🪙`;
        buyBtn.onclick = () => this.network.buyListing(item.id);
        row.appendChild(buyBtn);
        pMarketEl.appendChild(row);
      });
    }

    const chatBox = this.$('chatBox');
    chatBox.innerHTML = this.network.chatMessages.map(m => `<div><b>${m.name}：</b>${m.text}</div>`).join('') || '<span style="color:#888">歡迎來到世界頻道！</span>';
    chatBox.scrollTop = chatBox.scrollHeight;

    const upgEl = this.$('upgradeList');
    upgEl.innerHTML = `
      <div class="card"><b>💧 自動灌溉</b><small>生長時間 -15%</small><button class="btn-blue" data-upg="speed" style="margin-top:5px;width:100%" ${S.speed ? 'disabled' : ''}>${S.speed ? '已購買' : '180 🪙'}</button></div>
      <div class="card"><b>💎 品質肥料</b><small>出售價格 +20%</small><button class="btn-blue" data-upg="fert" style="margin-top:5px;width:100%" ${S.fertilizer ? 'disabled' : ''}>${S.fertilizer ? '已購買' : '220 🪙'}</button></div>
      <div class="card" style="grid-column:span 2"><b>🌾 擴建 3D 農地</b><small>增加 3 塊地塊</small><button class="btn-blue" data-upg="land" style="margin-top:5px;width:100%" ${S.extra ? 'disabled' : ''}>${S.extra ? '已擴建' : '500 🪙'}</button></div>
    `;
    upgEl.querySelectorAll('[data-upg]').forEach(btn => btn.onclick = () => this.handleBuyUpgrade(btn.dataset.upg));

    this.$('petBtn').disabled = S.pet;
    this.$('petBtn').textContent = S.pet ? '🐥 小雞已在農場中' : '領養小雞 (250 🪙)';
    this.$('questInfo').textContent = `收成進度：${Math.min(S.harvests, S.questTarget)} / ${S.questTarget} 次`;

    this.sm.save();
  }
}
