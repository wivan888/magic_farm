import * as THREE from 'three';
import { getBuildingSpec } from '../systems/GameData.js';

export class BuildingManager {
  constructor(stateManager, farmScene) {
    this.sm = stateManager;
    this.farmScene = farmScene;
    this.buildModeType = null;
    this.previewMesh = null;
    this.previewPos = new THREE.Vector3(6, 0, 0);
    this.previewRot = 0;
    this.placedMeshes = new Map();
    this.raycaster = new THREE.Raycaster();
  }

  hasBuilding(type) {
    return (this.sm.state.buildings || []).some(b => b.type === type);
  }

  enterBuildMode(type) {
    this.exitBuildMode();
    const spec = getBuildingSpec(type);
    if (!spec) return;
    this.buildModeType = type;
    this.previewMesh = new THREE.Mesh(
      new THREE.BoxGeometry(spec.w * 1.4, 1.5, spec.d * 1.4),
      new THREE.MeshStandardMaterial({ color: spec.color, transparent: true, opacity: 0.65 })
    );
    this.previewMesh.position.set(6, 0.75, 0);
    this.farmScene.scene.add(this.previewMesh);
  }

  exitBuildMode() {
    this.buildModeType = null;
    if (this.previewMesh) {
      this.farmScene.scene.remove(this.previewMesh);
      this.previewMesh = null;
    }
  }

  rotatePreview() {
    this.previewRot = (this.previewRot + Math.PI / 2) % (Math.PI * 2);
    if (this.previewMesh) this.previewMesh.rotation.y = this.previewRot;
  }

  updatePreview(clientX, clientY, camera) {
    if (!this.previewMesh) return;
    const mouse = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(mouse, camera);
    const hits = this.raycaster.intersectObject(this.farmScene.ground);
    if (hits.length > 0) {
      const pt = hits[0].point;
      this.previewPos.set(Math.round(pt.x), 0.75, Math.round(pt.z));
      this.previewMesh.position.copy(this.previewPos);
    }
  }

  tryPlaceSelected() {
    const spec = getBuildingSpec(this.buildModeType);
    if (!spec) return { ok: false };
    if (this.sm.state.coins < spec.cost) return { ok: false, msg: '🪙 金幣不足！' };
    this.sm.state.coins -= spec.cost;
    this.sm.state.buildings.push({
      uid: Date.now() + Math.random(),
      type: spec.id,
      x: this.previewPos.x,
      z: this.previewPos.z,
      rot: this.previewRot
    });
    this.rebuildAllBuildings();
    return { ok: true, msg: `🏗️ 成功建造【${spec.name}】！` };
  }

  removeBuilding(uid) {
    this.sm.state.buildings = (this.sm.state.buildings || []).filter(b => b.uid !== uid);
    this.rebuildAllBuildings();
  }

  rebuildAllBuildings() {
    this.placedMeshes.forEach(m => this.farmScene.scene.remove(m));
    this.placedMeshes.clear();
    (this.sm.state.buildings || []).forEach(b => {
      const spec = getBuildingSpec(b.type);
      if (!spec) return;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(spec.w * 1.4, 1.5, spec.d * 1.4),
        new THREE.MeshStandardMaterial({ color: spec.color })
      );
      mesh.position.set(b.x, 0.75, b.z);
      mesh.rotation.y = b.rot || 0;
      this.farmScene.scene.add(mesh);
      this.placedMeshes.set(b.uid, mesh);
    });
  }
}
