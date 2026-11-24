export const CROPS = [
  { id: 'wheat',      name: '小麥',   e: '🌾', cost: 10,  time: 6,  base: 22,  xp: 8,  level: 1, maxWeight: 1.5, color: 0xfacc15 },
  { id: 'carrot',     name: '紅蘿蔔', e: '🥕', cost: 18,  time: 10, base: 40,  xp: 14, level: 1, maxWeight: 2.2, color: 0xf97316 },
  { id: 'corn',       name: '玉米',   e: '🌽', cost: 32,  time: 15, base: 72,  xp: 22, level: 2, maxWeight: 3.0, color: 0xfde047 },
  { id: 'tomato',     name: '番茄',   e: '🍅', cost: 50,  time: 20, base: 115, xp: 32, level: 2, maxWeight: 2.8, color: 0xef4444 },
  { id: 'strawberry', name: '草莓',   e: '🍓', cost: 85,  time: 26, base: 195, xp: 48, level: 3, maxWeight: 1.8, color: 0xf43f5e },
  { id: 'pumpkin',    name: '南瓜',   e: '🎃', cost: 130, time: 34, base: 310, xp: 70, level: 4, maxWeight: 8.5, color: 0xea580c }
];

export const MUTATIONS = [
  { name: '巨型', e: '巨', mult: 1.6, w: 1.8, chance: 0.14 },
  { name: '黃金', e: '金', mult: 2.2, w: 1.1, chance: 0.09 },
  { name: '水晶', e: '晶', mult: 2.8, w: 1.2, chance: 0.05 },
  { name: '彩虹', e: '彩', mult: 3.8, w: 1.4, chance: 0.025 }
];

export const ANIMALS = [
  { id: 'chicken', name: '雪白母雞', e: '🐔', housing: 'coop', cost: 120, feedCost: 8,  cycle: 18, productId: 'egg',    productName: '新鮮雞蛋', productEmoji: '🥚', color: 0xffffff },
  { id: 'rabbit',  name: '垂耳兔',   e: '🐇', housing: 'coop', cost: 180, feedCost: 12, cycle: 22, productId: 'wool',   productName: '柔順兔毛', productEmoji: '🧶', color: 0xf8f9fa },
  { id: 'sheep',   name: '綿綿羊',   e: '🐑', housing: 'barn', cost: 320, feedCost: 20, cycle: 28, productId: 'fleece', productName: '頂級羊毛', productEmoji: '☁️', color: 0xf1f3f5 },
  { id: 'cow',     name: '乳牛',     e: '🐄', housing: 'barn', cost: 480, feedCost: 30, cycle: 35, productId: 'milk',   productName: '香濃鮮奶', productEmoji: '🥛', color: 0x343a40 },
  { id: 'pig',     name: '松露小豬', e: '🐖', housing: 'barn', cost: 650, feedCost: 40, cycle: 42, productId: 'truffle',productName: '黑松露',   productEmoji: '🍄', color: 0xffc9c9 }
];

export const GOODS_CATALOG = {
  egg:        { id: 'egg',        name: '新鮮雞蛋',   e: '🥚', basePrice: 36 },
  wool:       { id: 'wool',       name: '柔順兔毛',   e: '🧶', basePrice: 54 },
  fleece:     { id: 'fleece',     name: '頂級羊毛',   e: '☁️', basePrice: 92 },
  milk:       { id: 'milk',       name: '香濃鮮奶',   e: '🥛', basePrice: 135 },
  truffle:    { id: 'truffle',    name: '黑松露',     e: '🍄', basePrice: 210 },
  bread:      { id: 'bread',      name: '田園鄉村麵包', e: '🍞', basePrice: 95 },
  cheese:     { id: 'cheese',     name: '熟成切達起司', e: '🧀', basePrice: 290 },
  jam:        { id: 'jam',        name: '手作草莓果醬', e: '🍯', basePrice: 420 },
  pie:        { id: 'pie',        name: '皇家南瓜派',   e: '🥧', basePrice: 680 }
};

export const RECIPES = [
  { id: 'r_bread',  name: '田園鄉村麵包', e: '🍞', outputId: 'bread',  duration: 10, crops: { wheat: 2 }, goods: {}, desc: '小麥 ×2 → 售價 95 🪙' },
  { id: 'r_cheese', name: '熟成切達起司', e: '🧀', outputId: 'cheese', duration: 15, crops: {}, goods: { milk: 2 }, desc: '鮮奶 ×2 → 售價 290 🪙' },
  { id: 'r_jam',    name: '手作草莓果醬', e: '🍯', outputId: 'jam',    duration: 18, crops: { strawberry: 2 }, goods: {}, desc: '草莓 ×2 → 售價 420 🪙' },
  { id: 'r_pie',    name: '皇家南瓜派',   e: '🥧', outputId: 'pie',    duration: 24, crops: { pumpkin: 1, wheat: 1 }, goods: { egg: 1 }, desc: '南瓜×1 + 小麥×1 + 雞蛋×1 → 售價 680 🪙' }
];

export const BUILDING_CATALOG = [
  { id: 'well',      name: '石砌水井',   e: '⛲', cost: 160, w: 1, d: 1, color: 0x74c0fc },
  { id: 'silo',      name: '穀物倉庫',   e: '🗼', cost: 280, w: 1, d: 1, color: 0xff6b6b },
  { id: 'coop',      name: '溫馨雞舍',   e: '🛖', cost: 340, w: 2, d: 2, color: 0xffd43b },
  { id: 'barn',      name: '紅色大牛棚', e: '🏚️', cost: 520, w: 2, d: 2, color: 0xe03131 },
  { id: 'factory',   name: '加工工坊',   e: '🏭', cost: 600, w: 2, d: 2, color: 0x20c997 },
  { id: 'scarecrow', name: '稻草人',     e: '🎃', cost: 90,  w: 1, d: 1, color: 0xf59f00 },
  { id: 'fence',     name: '木頭圍籬',   e: '🚧', cost: 40,  w: 1, d: 1, color: 0xa0522d }
];

export const AUTOMATION_CONFIG = {
  seeder:    { id: 'seeder',    name: '自動播種機', e: '🤖', maxLv: 3, baseCost: 260, desc: '自動將選定種子播種至空地' },
  sprinkler: { id: 'sprinkler', name: '中央灑水器', e: '💦', maxLv: 3, baseCost: 240, desc: '定期自動為成長中作物澆水加速' },
  harvester: { id: 'harvester', name: '自動收割機', e: '🚜', maxLv: 3, baseCost: 340, desc: '作物成熟時自動採收存入倉庫' }
};

export function getCropById(id) {
  return CROPS.find(c => c.id === id) || CROPS[0];
}

export function getAnimalSpec(id) {
  return ANIMALS.find(a => a.id === id);
}

export function getBuildingSpec(id) {
  return BUILDING_CATALOG.find(b => b.id === id);
}
