const STORAGE_KEY = 'dream_farm_v10_save';

export class StateManager {
  constructor() {
    this.state = this.load();
  }

  getDefaultState() {
    return {
      coins: 900,
      level: 1,
      xp: 0,
      seed: 'wheat',
      selectedPlot: 0,
      plots: Array(9).fill(null),
      inventory: [],
      goodsBag: {},
      buildings: [],
      animals: [],
      processingQueue: [],
      automation: { enabled: true, seeder: 0, sprinkler: 0, harvester: 0 },
      speed: false,
      fertilizer: false,
      extra: false,
      pet: false,
      harvests: 0,
      questTarget: 10,
      marketDay: 0,
      marketSeeds: {},
      playerName: '',
      codex: { crops: [], animals: [], goods: [], mutations: [] },
      unlockedAchievements: [],
      seasonIdx: 0,
      seasonElapsed: 0,
      fishBag: [],
      logistics: { level: 0, autoShipThreshold: 0.85, totalShippedCoins: 0, totalShippedCount: 0 },
      techLevels: { bio_gene: 0, hydroponics: 0, cold_chain: 0, gourmet_craft: 0 },
      reputation: 0,
      townOrders: [],
      guildId: null,
      wonders: [],
      unlockedOutfits: ['classic'],
      currentOutfit: 'classic',
      expoRecord: { bestScore: 0, bestRank: '尚未參賽', lastEntryAt: 0 }
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.getDefaultState();
      return { ...this.getDefaultState(), ...JSON.parse(raw) };
    } catch {
      return this.getDefaultState();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.getDefaultState();
  }

  getSelectedPlot() {
    return this.state.plots[this.state.selectedPlot] || null;
  }

  getGrowthSpeedMultiplier() {
    return this.state.speed ? 0.85 : 1.0;
  }

  getMaxInventoryCapacity() {
    const silos = (this.state.buildings || []).filter(b => b.type === 'silo').length;
    return 20 + silos * 12;
  }

  getAnimalCapacity(housing) {
    const count = (this.state.buildings || []).filter(b => b.type === housing).length;
    return (housing === 'coop' ? 2 : 1) + count * 3;
  }

  addGood(goodId, qty = 1) {
    if (!this.state.goodsBag) this.state.goodsBag = {};
    this.state.goodsBag[goodId] = (this.state.goodsBag[goodId] || 0) + qty;
  }

  addXp(amount, onLevelUp) {
    this.state.xp += amount;
    while (this.state.xp >= this.state.level * 100) {
      this.state.xp -= this.state.level * 100;
      this.state.level += 1;
      this.state.coins += 120;
      onLevelUp?.(this.state.level);
    }
  }
}
