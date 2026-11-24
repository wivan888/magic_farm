import { io } from 'socket.io-client';

export class MultiplayerClient {
  constructor(stateManager, callbacks) {
    this.sm = stateManager;
    this.cb = callbacks || {};
    this.connected = false;
    this.players = [];
    this.leaderboard = [];
    this.listings = [];
    this.guilds = [
      { id: 'sunshine_coop', name: '向日葵農友社', level: 1, fund: 400, members: ['系統創會長'] },
      { id: 'starlight_union', name: '星光莊園聯盟', level: 1, fund: 650, members: ['系統創會長'] }
    ];
    this.cargoOrder = {
      id: 'cargo_local',
      title: '皇家遠洋商船補給訂單',
      targetQty: 25,
      currentQty: 0,
      rewardCoins: 600,
      rewardRep: 80
    };
    this.chatMessages = [];
    this.visitingFarm = null;
    this.globalEvent = { id: 'normal', name: '平常日', e: '🌿', desc: '風和日麗的農場時光', bonusType: 'none' };

    this.socket = io('http://localhost:3001', { autoConnect: true, reconnectionAttempts: 3 });
    this.bindSocketEvents();
  }

  bindSocketEvents() {
    this.socket.on('connect', () => {
      this.connected = true;
      this.syncMyState();
      this.socket.emit('market:listAll', (list) => { this.listings = list || []; this.cb.onUpdate?.(); });
      this.cb.onUpdate?.();
    });
    this.socket.on('disconnect', () => { this.connected = false; this.visitingFarm = null; this.cb.onUpdate?.(); });
    this.socket.on('players:update', (list) => { this.players = list || []; this.cb.onUpdate?.(); });
    this.socket.on('leaderboard:update', (board) => { this.leaderboard = board || []; this.cb.onUpdate?.(); });
    this.socket.on('guilds:update', (list) => { if (Array.isArray(list)) this.guilds = list; this.cb.onUpdate?.(); });
    this.socket.on('cargo:update', (order) => { if (order) this.cargoOrder = order; this.cb.onUpdate?.(); });
    this.socket.on('cargo:completed', ({ title, rewardCoins, rewardRep, finisher }) => {
      this.sm.state.coins += rewardCoins;
      this.sm.state.reputation = (this.sm.state.reputation || 0) + rewardRep;
      this.cb.onToast?.(`🚢 「${finisher}」完成了【${title}】！全服領取 +${rewardCoins} 🪙、+${rewardRep} 名聲！`);
      this.cb.onUpdate?.();
    });
    this.socket.on('event:update', (ev) => {
      if (ev) { this.globalEvent = ev; this.cb.onToast?.(`📢 全服活動啟動：${ev.e} ${ev.name}（${ev.desc}）`); this.cb.onUpdate?.(); }
    });
    this.socket.on('market:listingsUpdate', (list) => { this.listings = list || []; this.cb.onUpdate?.(); });
    this.socket.on('farm:helpedWater', ({ helperName }) => {
      let watered = 0;
      this.sm.state.plots.forEach(p => { if (p && (Date.now() - p.at) / 1000 < p.time) { p.at -= Math.min(8, p.time * 0.25) * 1000; watered++; } });
      this.cb.onToast?.(`💧 好友「${helperName}」幫你的 ${watered} 塊農田澆水了！`);
      this.cb.onUpdate?.();
    });
    this.socket.on('market:soldNotify', ({ label, price, buyerName }) => {
      this.sm.state.coins += price;
      this.cb.onToast?.(`💰 「${buyerName}」買走了你的 ${label}，入帳 +${price} 🪙！`);
      this.cb.onUpdate?.();
    });
    this.socket.on('chat:msg', (msg) => {
      this.chatMessages.push(msg);
      if (this.chatMessages.length > 30) this.chatMessages.shift();
      this.cb.onUpdate?.();
    });
  }

  getMyGuild() { return this.guilds.find(g => g.id === this.sm.state.guildId) || null; }
  getGuildBonusMultiplier() { const g = this.getMyGuild(); return g ? 1 + g.level * 0.04 : 1.0; }

  joinGuild(guildId) {
    this.sm.state.guildId = guildId;
    const g = this.getMyGuild();
    this.cb.onToast?.(`🤝 已加入公會【${g?.name || guildId}】！`);
    this.cb.onUpdate?.();
  }

  createGuild(name) {
    if (!name.trim()) return;
    if (this.sm.state.coins < 300) return this.cb.onToast?.('🪙 建立公會需要 300 🪙！');
    this.sm.state.coins -= 300;
    if (this.connected) {
      this.socket.emit('guild:create', { name, playerName: this.sm.state.playerName }, (res) => {
        if (res?.ok) { this.sm.state.guildId = res.guildId; this.cb.onToast?.(`🏛️ 成功創立公會【${name}】！`); this.cb.onUpdate?.(); }
      });
    } else {
      const id = `guild_${Date.now()}`;
      this.guilds.push({ id, name: name.trim(), level: 1, fund: 0, members: [this.sm.state.playerName] });
      this.sm.state.guildId = id;
      this.cb.onToast?.(`🏛️ 成功創立公會【${name}】！`);
      this.cb.onUpdate?.();
    }
  }

  donateGuild(amount = 150) {
    const g = this.getMyGuild();
    if (!g) return this.cb.onToast?.('請先加入一個公會！');
    if (this.sm.state.coins < amount) return this.cb.onToast?.('🪙 金幣不足！');
    this.sm.state.coins -= amount;
    this.sm.state.reputation = (this.sm.state.reputation || 0) + 12;
    if (this.connected) {
      this.socket.emit('guild:donate', { guildId: g.id, amount, donorName: this.sm.state.playerName }, (res) => {
        if (res?.ok) {
          this.cb.onToast?.(res.leveledUp ? `🎉 公會【${res.guild.name}】升至 Lv.${res.guild.level}！` : `💖 捐獻 ${amount} 🪙 給公會，獲得 +12 名聲！`);
          this.cb.onUpdate?.();
        }
      });
    } else {
      g.fund += amount;
      if (g.fund >= g.level * 1000) { g.fund -= g.level * 1000; g.level += 1; }
      this.cb.onToast?.(`💖 捐獻 ${amount} 🪙 給公會，獲得 +12 名聲！`);
      this.cb.onUpdate?.();
    }
  }

  contributeCargo() {
    const S = this.sm.state;
    if (!S.inventory.length) return this.cb.onToast?.('背包沒有作物可裝箱捐獻！');
    S.inventory.pop();
    S.coins += 35;
    S.reputation = (S.reputation || 0) + 8;
    if (this.connected) {
      this.socket.emit('cargo:contribute', { qty: 1, contributorName: S.playerName || '熱心農夫' }, () => {
        this.cb.onToast?.('🚢 已裝箱 1 件作物至商船！立即獲得 +35 🪙 與 +8 名聲！');
        this.cb.onUpdate?.();
      });
    } else {
      this.cargoOrder.currentQty += 1;
      if (this.cargoOrder.currentQty >= this.cargoOrder.targetQty) {
        S.coins += this.cargoOrder.rewardCoins;
        this.cargoOrder.currentQty = 0;
        this.cb.onToast?.(`🚢 商船滿載啟航！獲得大訂單分紅 +${this.cargoOrder.rewardCoins} 🪙！`);
      } else {
        this.cb.onToast?.('🚢 已裝箱 1 件作物至商船！獲得 +35 🪙！');
      }
      this.cb.onUpdate?.();
    }
  }

  syncMyState() {
    if (!this.connected) return;
    const S = this.sm.state;
    this.socket.emit('player:sync', { name: S.playerName || '夢想農夫', level: S.level, coins: S.coins, harvests: S.harvests, plots: S.plots, buildings: S.buildings, animals: S.animals });
  }

  visitPlayer(targetId) {
    if (!this.connected) return this.cb.onToast?.('⚠️ 尚未連線至多人伺服器');
    if (targetId === this.socket.id) return this.cb.onToast?.('你已經在自己的農場囉！');
    this.socket.emit('farm:visit', targetId, (res) => {
      if (!res?.ok) return this.cb.onToast?.(res?.msg || '拜訪失敗');
      this.visitingFarm = res.farm;
      this.cb.onToast?.(`🏡 正在拜訪「${res.farm.name}」的農場！`);
      this.cb.onUpdate?.();
    });
  }

  leaveVisit() { this.visitingFarm = null; this.cb.onToast?.('🏠 已回到自己的農場'); this.cb.onUpdate?.(); }

  helpWaterVisitedFarm() {
    if (!this.visitingFarm || !this.connected) return;
    this.socket.emit('farm:helpWater', { targetId: this.visitingFarm.id, helperName: this.sm.state.playerName || '熱心農夫' });
    this.sm.state.coins += 25;
    this.sm.addXp(10);
    this.cb.onToast?.('💧 互助澆水成功！獲得 +25 🪙、+10 XP！');
    this.cb.onUpdate?.();
  }

  createListing(kind, itemData, label, price) {
    if (!this.connected) return this.cb.onToast?.('⚠️ 尚未連線至多人伺服器');
    this.socket.emit('market:create', { kind, itemData, label, price }, (res) => {
      if (res?.ok) { this.cb.onToast?.(`🏛️ 已將「${label}」上架至玩家市場！`); this.cb.onUpdate?.(); }
    });
  }

  buyListing(listingId) {
    if (!this.connected) return this.cb.onToast?.('⚠️ 尚未連線至多人伺服器');
    const target = this.listings.find(x => x.id === listingId);
    if (!target || target.sellerId === this.socket.id) return;
    if (this.sm.state.coins < target.price) return this.cb.onToast?.('🪙 金幣不足！');
    this.socket.emit('market:buy', { listingId, buyerName: this.sm.state.playerName || '夢想農夫' }, (res) => {
      if (!res?.ok) return this.cb.onToast?.(res?.msg || '購買失敗');
      const sold = res.sold;
      this.sm.state.coins -= sold.price;
      if (sold.kind === 'crop') this.sm.state.inventory.unshift(sold.itemData);
      else if (sold.kind === 'good') this.sm.addGood(sold.itemData.goodId, sold.itemData.qty || 1);
      this.cb.onToast?.(`🛍️ 成功購入「${sold.label}」並存入背包！`);
      this.cb.onUpdate?.();
    });
  }

  sendChat(text) {
    if (!this.connected || !text.trim()) return;
    this.socket.emit('chat:send', { name: this.sm.state.playerName || '夢想農夫', text });
  }
}
