import * as THREE from 'three';

export class PetManager {
  constructor(scene, stateManager) {
    this.scene = scene;
    this.sm = stateManager;
    this.chick = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffd43b })
    );
    this.chick.position.set(1, 0.24, 6);
    this.chick.visible = !!this.sm.state.pet;
    this.scene.add(this.chick);
  }

  update(elapsed, playerPos) {
    this.chick.visible = !!this.sm.state.pet;
    if (!this.chick.visible || !playerPos) return;
    const tx = playerPos.x - 1.1;
    const tz = playerPos.z + 0.8;
    this.chick.position.x += (tx - this.chick.position.x) * 0.06;
    this.chick.position.z += (tz - this.chick.position.z) * 0.06;
    this.chick.position.y = 0.24 + Math.abs(Math.sin(elapsed * 8)) * 0.1;
  }
}
