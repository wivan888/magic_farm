import * as THREE from 'three';

export const SEASONS = [
  { id: 'spring', name: '春季・櫻花風', e: '🌸', duration: 90, groundColor: 0x7bc950, fogColor: 0xdff5e3, growthMult: 0.85, priceMult: 1.0,  desc: '春暖花開，作物成長速度 +15%' },
  { id: 'summer', name: '夏季・艷陽天', e: '🌻', duration: 90, groundColor: 0x5eb338, fogColor: 0xfff3bf, growthMult: 0.90, priceMult: 1.15, desc: '陽光充沛，所有農漁產售價 +15%' },
  { id: 'autumn', name: '秋季・楓葉季', e: '🍁', duration: 90, groundColor: 0xc98a3c, fogColor: 0xffe8cc, growthMult: 1.0,  priceMult: 1.25, desc: '豐收金秋，出售價格 +25%' },
  { id: 'winter', name: '冬季・初雪日', e: '❄️', duration: 90, groundColor: 0xdceef8, fogColor: 0xe7f5ff, growthMult: 1.15, priceMult: 1.35, desc: '冬藏時節，生長較慢但稀缺售價 +35%' }
];

export class SeasonSystem {
  constructor(stateManager, farmScene) {
    this.sm = stateManager;
    this.scene = farmScene;
    if (typeof this.sm.state.seasonIdx !== 'number') {
      this.sm.state.seasonIdx = 0;
      this.sm.state.seasonElapsed = 0;
    }
  }

  getCurrentSeason() {
    return SEASONS[this.sm.state.seasonIdx % SEASONS.length];
  }

  applyVisuals() {
    const s = this.getCurrentSeason();
    if (this.scene?.scene?.fog) this.scene.scene.fog.color.setHex(s.fogColor);
    if (this.scene?.ground?.material) this.scene.ground.material.color.setHex(s.groundColor);
  }

  tick() {
    const S = this.sm.state;
    S.seasonElapsed = (S.seasonElapsed || 0) + 1;
    if (S.seasonElapsed >= this.getCurrentSeason().duration) {
      S.seasonElapsed = 0;
      S.seasonIdx = (S.seasonIdx + 1) % SEASONS.length;
      this.applyVisuals();
      return true;
    }
    return false;
  }
}
