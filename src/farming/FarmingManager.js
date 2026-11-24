import * as THREE from 'three';
import { MUTATIONS, getCropById } from '../systems/GameData.js';

export class FarmingManager {
  constructor(stateManager, farmScene) {
    this.sm = stateManager;
    this.farmScene = farmScene;
    this.plotMeshes = [];
    this.cropMeshes = [];
    this.raycaster = new THREE.Raycaster();
  }

  getPlotCoords(idx) {
    const cols = 3;
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    return { x: (col - 1) * 2.6, z: (row - 1.5) * 2.6 };
  }

  rebuildPlots() {
    this.plotMeshes.forEach(m => this.farmScene.scene.remove(m));
    this.cropMeshes.forEach(m => { if (m) this.farmScene.scene.remove(m); });
    this.plotMeshes = [];
    this.cropMeshes = [];

    this.sm.state.plots.forEach((_, idx) => {
      const { x, z } = this.getPlotCoords(idx);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.22, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.9 })
      );
      mesh.position.set(x, 0.11, z);
      mesh.userData.plotIdx = idx;
      this.farmScene.scene.add(mesh);
      this.plotMeshes.push(mesh);
      this.cropMeshes.push(null);
    });
  }

  pickPlot(clientX, clientY, camera) {
    const mouse = new THREE.Vector2(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, camera);
    const hits = this.raycaster.intersectObjects(this.plotMeshes);
    return hits.length > 0 ? hits[0].object.userData.plotIdx : null;
  }

  isMature(plot) {
    if (!plot) return false;
    return (Date.now() - plot.at) / 1000 >= plot.time;
  }

  rollMutations() {
    const res = [];
    for (const m of MUTATIONS) {
      if (Math.random() < m.chance) res.push(m.name);
    }
    return res;
  }

  update(dt, elapsed) {
    const S = this.sm.state;
    S.plots.forEach((p, idx) => {
      const soil = this.plotMeshes[idx];
      if (soil) {
        soil.material.color.setHex(S.selectedPlot === idx ? 0xb06d33 : 0x8d5524);
      }
      if (!p) {
        if (this.cropMeshes[idx]) {
          this.farmScene.scene.remove(this.cropMeshes[idx]);
          this.cropMeshes[idx] = null;
        }
        return;
      }
      const c = getCropById(p.id);
      if (!this.cropMeshes[idx]) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 10, 10),
          new THREE.MeshStandardMaterial({ color: c.color })
        );
        const { x, z } = this.getPlotCoords(idx);
        mesh.position.set(x, 0.45, z);
        this.farmScene.scene.add(mesh);
        this.cropMeshes[idx] = mesh;
      }
      const ratio = Math.min(1, Math.max(0.2, (Date.now() - p.at) / 1000 / p.time));
      const mutScale = p.muts?.includes('巨型') ? 1.45 : 1.0;
      const sc = ratio * mutScale;
      this.cropMeshes[idx].scale.set(sc, sc, sc);
      if (ratio >= 1) {
        this.cropMeshes[idx].position.y = 0.5 + Math.sin(elapsed * 4 + idx) * 0.08;
      }
    });
  }
}
