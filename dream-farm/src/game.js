import * as THREE from 'three';
import { StateManager } from './systems/StateManager.js';
import { WeatherSystem } from './systems/WeatherSystem.js';
import { SeasonSystem } from './systems/SeasonSystem.js';
import { MarketSystem } from './systems/MarketSystem.js';
import { AutomationSystem } from './systems/AutomationSystem.js';
import { ProcessingSystem } from './systems/ProcessingSystem.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { FishingSystem } from './systems/FishingSystem.js';
import { LogisticsSystem } from './systems/LogisticsSystem.js';
import { ResearchSystem } from './systems/ResearchSystem.js';
import { TownOrderSystem } from './systems/TownOrderSystem.js';
import { WonderSystem } from './systems/WonderSystem.js';
import { ExpoSystem } from './systems/ExpoSystem.js';
import { MultiplayerClient } from './network/MultiplayerClient.js';
import { FarmScene } from './scenes/FarmScene.js';
import { PlayerController } from './player/PlayerController.js';
import { FarmingManager } from './farming/FarmingManager.js';
import { BuildingManager } from './buildings/BuildingManager.js';
import { AnimalManager } from './animals/AnimalManager.js';
import { PetManager } from './pets/PetManager.js';
import { HUDManager } from './ui/HUDManager.js';

export class Game {
  constructor(container, uiRoot) {
    this.container = container;
    this.uiRoot = uiRoot;
    this.clock = new THREE.Clock();

    this.stateManager = new StateManager();
    this.farmScene = new FarmScene(this.container);

    this.weatherSystem = new WeatherSystem(this.stateManager, this.farmScene);
    this.seasonSystem = new SeasonSystem(this.stateManager, this.farmScene);
    this.marketSystem = new MarketSystem(this.stateManager);
    this.farmingManager = new FarmingManager(this.stateManager, this.farmScene);
    this.buildingManager = new BuildingManager(this.stateManager, this.farmScene);
    this.animalManager = new AnimalManager(this.stateManager, this.farmScene);
    this.processingSystem = new ProcessingSystem(this.stateManager, this.buildingManager);
    this.achievementSystem = new AchievementSystem(this.stateManager);
    this.fishingSystem = new FishingSystem(this.stateManager, this.farmScene);
    this.logisticsSystem = new LogisticsSystem(this.stateManager, this.marketSystem);
    this.researchSystem = new ResearchSystem(this.stateManager);
    this.townOrderSystem = new TownOrderSystem(this.stateManager);
    this.wonderSystem = new WonderSystem(this.stateManager, this.farmScene);
    this.automationSystem = new AutomationSystem(
      this.stateManager,
      this.farmingManager,
      this.buildingManager,
      this.farmScene
    );

    this.network = new MultiplayerClient(this.stateManager, {
      onToast: (msg) => this.hud?.showToast(msg),
      onUpdate: () => this.hud?.render()
    });

    this.playerController = new PlayerController(
      this.farmScene.scene,
      this.farmScene.camera,
      this.farmScene.renderer.domElement,
      this.farmingManager,
      () => this.hud.render()
    );
    this.expoSystem = new ExpoSystem(this.stateManager, this.playerController);
    this.petManager = new PetManager(this.farmScene.scene, this.stateManager);

    this.hud = new HUDManager(this.uiRoot, {
      stateManager: this.stateManager,
      weatherSystem: this.weatherSystem,
      seasonSystem: this.seasonSystem,
      marketSystem: this.marketSystem,
      farmingManager: this.farmingManager,
      buildingManager: this.buildingManager,
      automationSystem: this.automationSystem,
      animalManager: this.animalManager,
      processingSystem: this.processingSystem,
      achievementSystem: this.achievementSystem,
      fishingSystem: this.fishingSystem,
      logisticsSystem: this.logisticsSystem,
      researchSystem: this.researchSystem,
      townOrderSystem: this.townOrderSystem,
      wonderSystem: this.wonderSystem,
      expoSystem: this.expoSystem,
      network: this.network,
      petManager: this.petManager
    });

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('resize', () => this.farmScene.onResize());
    const dom = this.farmScene.renderer.domElement;

    dom.addEventListener('mousemove', (e) => {
      if (this.buildingManager.buildModeType) {
        this.buildingManager.updatePreview(e.clientX, e.clientY, this.farmScene.camera);
      }
    });

    dom.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        if (this.buildingManager.buildModeType) {
          const result = this.buildingManager.tryPlaceSelected();
          if (result.msg) this.hud.showToast(result.msg);
          this.hud.render();
          return;
        }
        const picked = this.farmingManager.pickPlot(e.clientX, e.clientY, this.farmScene.camera);
        if (picked !== null) {
          this.stateManager.state.selectedPlot = picked;
          this.hud.render();
        }
      } else if (e.button === 2 && this.buildingManager.buildModeType) {
        this.buildingManager.exitBuildMode();
        this.hud.render();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.code === 'Escape' && this.buildingManager.buildModeType) {
        this.buildingManager.exitBuildMode();
        this.hud.render();
        return;
      }
      if (e.code === 'KeyR' && this.buildingManager.buildModeType) {
        this.buildingManager.rotatePreview();
        return;
      }
      if (e.code === 'KeyE') {
        const plot = this.stateManager.getSelectedPlot();
        if (!plot) this.hud.handlePlant();
        else if (this.farmingManager.isMature(plot)) this.hud.handleHarvest();
      } else if (e.code === 'KeyF') {
        this.hud.handleWater();
      }
    });
  }

  start() {
    this.weatherSystem.applyVisuals();
    this.seasonSystem.applyVisuals();
    this.expoSystem.applyOutfitVisuals();
    this.farmingManager.rebuildPlots();
    this.buildingManager.rebuildAllBuildings();
    this.animalManager.rebuildAnimals();
    this.wonderSystem.syncVisuals();
    this.automationSystem.syncVisuals();
    this.hud.render();

    let syncCounter = 0;
    setInterval(() => {
      if (this.seasonSystem.tick()) {
        const s = this.seasonSystem.getCurrentSeason();
        this.hud.showToast(`${s.e} 季節更替為【${s.name}】！${s.desc}`);
      }
      if (this.weatherSystem.tick()) {
        const w = this.weatherSystem.getCurrentWeather();
        this.hud.showToast(`${w.e} 天氣變成了 ${w.name}！`);
      }
      if (this.marketSystem.tick()) {
        this.hud.showToast(`📊 市場第 ${this.stateManager.state.marketDay + 1} 波行情已更新！`);
      }
      const autoSummary = this.automationSystem.tick((lvl) => {
        this.hud.showModal('🎉 農場升級！', `恭喜升到 Lv.${lvl}！獲得 120 金幣！`);
      });
      if (autoSummary) this.hud.showToast(autoSummary);

      const procMsg = this.processingSystem.tick();
      if (procMsg) this.hud.showToast(procMsg);

      const mult = this.weatherSystem.getPriceMultiplier()
        * this.seasonSystem.getCurrentSeason().priceMult
        * this.researchSystem.getSellMultiplier()
        * this.townOrderSystem.getReputationRank().bonusMult
        * this.wonderSystem.getSellMultiplier()
        * this.expoSystem.getOutfitSellMultiplier()
        * this.network.getGuildBonusMultiplier();
      const logiMsg = this.logisticsSystem.tick(mult);
      if (logiMsg) this.hud.showToast(logiMsg);

      const unlocked = this.achievementSystem.evaluate();
      if (unlocked.length > 0) {
        const first = unlocked[0];
        this.hud.showToast(`🏆 解鎖成就「${first.e} ${first.name}」！獎勵 +${first.reward} 🪙`);
      }

      syncCounter++;
      if (syncCounter % 4 === 0) this.network.syncMyState();

      this.hud.render();
    }, 1000);

    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    this.playerController.update(dt, elapsed);
    this.petManager.update(elapsed, this.playerController.player.position);
    this.farmingManager.update(dt, elapsed);
    this.animalManager.update(dt, elapsed);
    this.fishingSystem.update(elapsed);
    this.wonderSystem.update(elapsed);
    this.automationSystem.updateVisuals(dt, elapsed);
    this.weatherSystem.updateParticles(dt);

    this.farmScene.render();
  }
}
