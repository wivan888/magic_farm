import * as THREE from 'three';

const WEATHERS = [
  { id: 'sunny', name: '晴朗', e: '☀️', duration: 60, priceMult: 1.0, sky: 0x87ceeb },
  { id: 'rain',  name: '細雨', e: '🌧️', duration: 45, priceMult: 1.1, sky: 0x6c7a89 },
  { id: 'windy', name: '微風', e: '🍃', duration: 50, priceMult: 1.05, sky: 0x99d9ea }
];

export class WeatherSystem {
  constructor(stateManager, farmScene) {
    this.sm = stateManager;
    this.farmScene = farmScene;
    this.idx = 0;
    this.elapsed = 0;
    this.rainParticles = null;
    this.initRain();
  }

  initRain() {
    if (!this.farmScene?.scene) return;
    const count = 400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 45;
      pos[i + 1] = Math.random() * 20;
      pos[i + 2] = (Math.random() - 0.5) * 45;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xa5d8ff, size: 0.16, transparent: true, opacity: 0.75 });
    this.rainParticles = new THREE.Points(geo, mat);
    this.rainParticles.visible = false;
    this.farmScene.scene.add(this.rainParticles);
  }

  getCurrentWeather() {
    return WEATHERS[this.idx % WEATHERS.length];
  }

  getPriceMultiplier() {
    return this.getCurrentWeather().priceMult;
  }

  applyVisuals() {
    const w = this.getCurrentWeather();
    if (this.farmScene?.scene) {
      this.farmScene.scene.background = new THREE.Color(w.sky);
    }
    if (this.rainParticles) {
      this.rainParticles.visible = w.id === 'rain';
    }
  }

  tick() {
    this.elapsed++;
    if (this.elapsed >= this.getCurrentWeather().duration) {
      this.elapsed = 0;
      this.idx = (this.idx + 1) % WEATHERS.length;
      this.applyVisuals();
      return true;
    }
    return false;
  }

  updateParticles(dt) {
    if (!this.rainParticles || !this.rainParticles.visible) return;
    const arr = this.rainParticles.geometry.attributes.position.array;
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] -= 18 * dt;
      if (arr[i] < 0) arr[i] = 20;
    }
    this.rainParticles.geometry.attributes.position.needsUpdate = true;
  }
}
