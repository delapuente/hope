
function SoulRender(soul) {
  Render.apply(this, arguments);
  this.soul = soul;
  this.soulMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  this.soulMesh =
    new THREE.Mesh(new THREE.SphereGeometry(this.soul.SIZE), this.soulMaterial);

  GfxSystem.scene.add(this.soulMesh);
}
theClass(SoulRender).inheritsFrom(Render);

function Soul() {
  Model.apply(this, arguments);
}
theClass(Soul).inheritsFrom(Model);

Soul.prototype.render = SoulRender;

Soul.prototype.simulate = function (isPostStep, t, dt) {
  this._simulateDelay = this._simulateDelay || Math.random() * 2;
  this.position.y = Math.sin(t/1000 + this._simulateDelay * 2);
};

Soul.prototype.SIZE = 1.5;

Object.defineProperty(Soul.prototype, 'position', {
  get: function () { return this.render.soulMesh.position; }
});
