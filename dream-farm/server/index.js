import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const onlinePlayers = new Map();
const marketListings = [];

const guilds = new Map([
  ['sunshine_coop', { id: 'sunshine_coop', name: '向日葵農友社', level: 1, fund: 400, members: [] }],
  ['starlight_union', { id: 'starlight_union', name: '星光莊園聯盟', level: 1, fund: 650, members: [] }]
]);

let globalCargoOrder = {
  id: 'cargo_1',
  title: '皇家遠洋商船補給訂單',
  targetQty: 25,
  currentQty: 0,
  rewardCoins: 600,
  rewardRep: 80
};

let globalEvent = {
  id: 'normal',
  name: '平常日',
  e: '🌿',
  desc: '風和日麗的農場時光',
  bonusType: 'none',
  endsAt: Date.now() + 120000
};

const GLOBAL_EVENTS = [
  { id: 'harvest_fest', name: '全服大豐收祭', e: '🎊', desc: '全服收成經驗 +50%！', bonusType: 'xp' },
  { id: 'gold_rush', name: '皇家採購週', e: '👑', desc: '所有作物與加工品出售金幣 +25%！', bonusType: 'gold' },
  { id: 'mutation_wave', name: '星象異變潮', e: '☄️', desc: '全服作物突變機率翻倍！', bonusType: 'mutation' }
];

setInterval(() => {
  if (Date.now() > globalEvent.endsAt) {
    const pick = GLOBAL_EVENTS[Math.floor(Math.random() * GLOBAL_EVENTS.length)];
    globalEvent = { ...pick, endsAt: Date.now() + 90000 };
    io.emit('event:update', globalEvent);
  }
}, 5000);

function getLeaderboard() {
  return Array.from(onlinePlayers.values())
    .map(p => ({
      id: p.id,
      name: p.name,
      level: p.level,
      coins: Math.floor(p.coins || 0),
      harvests: p.harvests || 0,
      score: (p.level * 500) + Math.floor((p.coins || 0) * 0.2) + ((p.harvests || 0) * 15)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function broadcastGuilds() {
  io.emit('guilds:update', Array.from(guilds.values()));
}

function broadcastPlayers() {
  const list = Array.from(onlinePlayers.values()).map(p => ({
    id: p.id,
    name: p.name,
    level: p.level
  }));
  io.emit('players:update', list);
  io.emit('leaderboard:update', getLeaderboard());
}

io.on('connection', (socket) => {
  socket.emit('event:update', globalEvent);
  socket.emit('guilds:update', Array.from(guilds.values()));
  socket.emit('cargo:update', globalCargoOrder);

  socket.on('player:sync', (payload) => {
    onlinePlayers.set(socket.id, {
      id: socket.id,
      name: payload.name || `農夫_${socket.id.slice(0, 4)}`,
      level: payload.level || 1,
      coins: payload.coins || 0,
      harvests: payload.harvests || 0,
      plots: payload.plots || [],
      buildings: payload.buildings || [],
      animals: payload.animals || []
    });
    broadcastPlayers();
  });

  socket.on('guild:create', ({ name, playerName }, cb) => {
    const clean = (name || '').trim().slice(0, 14);
    if (!clean) return cb?.({ ok: false, msg: '請輸入公會名稱' });
    const id = `guild_${Date.now().toString(36)}`;
    guilds.set(id, { id, name: clean, level: 1, fund: 0, members: [playerName || '創會長'] });
    broadcastGuilds();
    cb?.({ ok: true, guildId: id });
  });

  socket.on('guild:donate', ({ guildId, amount, donorName }, cb) => {
    const g = guilds.get(guildId);
    if (!g) return cb?.({ ok: false, msg: '找不到該公會' });
    g.fund += amount;
    if (!g.members.includes(donorName)) g.members.push(donorName);
    const nextThreshold = g.level * 1000;
    let leveledUp = false;
    if (g.fund >= nextThreshold && g.level < 10) {
      g.fund -= nextThreshold;
      g.level += 1;
      leveledUp = true;
    }
    broadcastGuilds();
    cb?.({ ok: true, guild: g, leveledUp });
  });

  socket.on('cargo:contribute', ({ qty, contributorName }, cb) => {
    globalCargoOrder.currentQty += qty;
    let completed = false;
    if (globalCargoOrder.currentQty >= globalCargoOrder.targetQty) {
      completed = true;
      io.emit('cargo:completed', {
        title: globalCargoOrder.title,
        rewardCoins: globalCargoOrder.rewardCoins,
        rewardRep: globalCargoOrder.rewardRep,
        finisher: contributorName
      });
      globalCargoOrder = {
        id: `cargo_${Date.now()}`,
        title: '跨服王國糧倉緊急徵集令',
        targetQty: globalCargoOrder.targetQty + 10,
        currentQty: 0,
        rewardCoins: globalCargoOrder.rewardCoins + 250,
        rewardRep: globalCargoOrder.rewardRep + 30
      };
    }
    io.emit('cargo:update', globalCargoOrder);
    cb?.({ ok: true, completed });
  });

  socket.on('farm:visit', (targetId, cb) => {
    const target = onlinePlayers.get(targetId);
    if (!target) return cb?.({ ok: false, msg: '該玩家已離線' });
    cb?.({ ok: true, farm: target });
  });

  socket.on('farm:helpWater', ({ targetId, helperName }) => {
    const targetSocket = io.sockets.sockets.get(targetId);
    if (targetSocket) targetSocket.emit('farm:helpedWater', { helperName });
  });

  socket.on('market:listAll', (cb) => cb?.(marketListings));

  socket.on('market:create', (listing, cb) => {
    const player = onlinePlayers.get(socket.id);
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sellerId: socket.id,
      sellerName: player?.name || '神秘農夫',
      kind: listing.kind,
      itemData: listing.itemData,
      label: listing.label,
      price: Math.max(1, Math.round(Number(listing.price) || 10)),
      createdAt: Date.now()
    };
    marketListings.unshift(entry);
    io.emit('market:listingsUpdate', marketListings);
    cb?.({ ok: true, entry });
  });

  socket.on('market:buy', ({ listingId, buyerName }, cb) => {
    const idx = marketListings.findIndex(x => x.id === listingId);
    if (idx === -1) return cb?.({ ok: false, msg: '商品已被買走或下架！' });
    const [sold] = marketListings.splice(idx, 1);
    io.emit('market:listingsUpdate', marketListings);
    const sellerSocket = io.sockets.sockets.get(sold.sellerId);
    if (sellerSocket) {
      sellerSocket.emit('market:soldNotify', { label: sold.label, price: sold.price, buyerName });
    }
    cb?.({ ok: true, sold });
  });

  socket.on('chat:send', ({ name, text }) => {
    if (!text || !text.trim()) return;
    io.emit('chat:msg', { name: name || '農夫', text: text.trim().slice(0, 120), at: Date.now() });
  });

  socket.on('disconnect', () => {
    onlinePlayers.delete(socket.id);
    broadcastPlayers();
  });
});

server.listen(3001, () => {
  console.log('🌈 Dream Farm V10.0 Server running on http://localhost:3001');
});
