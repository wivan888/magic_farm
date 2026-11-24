import * as THREE from 'three';

export class PlayerController {
  constructor(scene, camera, domElement, farmingManager, onAction) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.farming = farmingManager;
    this.onAction = onAction;
    this.keys = {};
    this.camAngle = 0;
    this.camDist = 17;
    this.isDragging = false;
    this.lastX = 0;

    this.player = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.38, 0.85, 12),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
    );
    body.position.y = 0.7;
    this.player.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd8a8 })
    );
    head.position.y = 1.32;
    this.player.add(head);

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.55, 0.22, 14),
      new THREE.MeshStandardMaterial({ color: 0xeab308 })
    );
    hat.position.y = 1.56;
    this.player.add(hat);

    this.player.position.set(0, 0, 5.5);
    this.scene.add(this.player);

    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    domElement.addEventListener('mousedown', (e) => { if (e.button === 2) { this.isDragging = true; this.lastX = e.clientX; } });
    window.addEventListener('mouseup', () => { this.isDragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.camAngle -= (e.clientX - this.lastX) * 0.008;
        this.lastX = e.clientX;
      }
    });
    domElement.addEventListener('wheel', (e) => {
      this.camDist = Math.max(8, Math.min(28, this.camDist + e.deltaY * 0.01));
    });
    domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  update(dt, elapsed) {
    if (document.activeElement?.tagName === 'INPUT') return;
    let dx = 0, dz = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) dz -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) dz += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

    if (dx !== 0 || dz !== 0) {
      const len = Math.hypot(dx, dz);
      dx /= len; dz /= len;
      const sin = Math.sin(this.camAngle), cos = Math.cos(this.camAngle);
      const vx = dx * cos + dz * sin;
      const vz = dz * cos - dx * sin;
      this.player.position.x = Math.max(-18, Math.min(18, this.player.position.x + vx * 6.5 * dt));
      this.player.position.z = Math.max(-18, Math.min(18, this.player.position.z + vz * 6.5 * dt));
      this.player.rotation.y = Math.atan2(vx, vz);
      this.player.position.y = Math.abs(Math.sin(elapsed * 12)) * 0.12;
    } else {
      this.player.position.y = 0;
    }

    this.camera.position.x = this.player.position.x + Math.sin(this.camAngle) * this.camDist;
    this.camera.position.z = this.player.position.z + Math.cos(this.camAngle) * this.camDist;
    this.camera.position.y = this.camDist * 0.78;
    this.camera.lookAt(this.player.position.x, 0.8, this.player.position.z);
  }
}
