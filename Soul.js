
function SoulRender(soul) {
  Render.apply(this, arguments);
  this.soul = soul;
  this.soulMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  this.soulMesh =
    new THREE.Mesh(new THREE.SphereGeometry(this.soul.SIZE), this.soulMaterial);
  soul.addEventListener('powerChanged', this.changeMaterial.bind(this));

  GfxSystem.scene.add(this.soulMesh);
}
theClass(SoulRender).inheritsFrom(Render);

SoulRender.prototype.changeMaterial = function (evt) {
  var range = 0xffffff - 0xffff00;
  var value = Math.floor(evt.power * range) & 0xffffff;
  this.soulMesh.material.color.setHex(value + 0xffff00);
};

function Soul() {
  Model.apply(this, arguments);
  this.hope = null;
  this._power = 0;
}
theClass(Soul).inheritsFrom(Model);

Soul.prototype.render = SoulRender;

Soul.prototype.CHARGE_SPEED = 0.5;

Soul.prototype.simulate = function (isPostStep, t, dt) {
  if (isPostStep) {
    this._simulateDelay = this._simulateDelay || Math.random() * 2;
    this.position.y = Math.sin(t/1000 + this._simulateDelay * 2);
    this.followHope(t, dt);
  }
  if (this.hope && this.hope.isCasting) {
    this.setPower(this.getPower() + this.CHARGE_SPEED * dt / 1000);
  }
  else {
    this.setPower(this.getPower() - this.CHARGE_SPEED * dt / 1000);
  }
  this.isCasting = this.getPower() === 1;
};

Soul.prototype.setPower = function (power) {
  this._power = Math.min(Math.max(power, 0), 1);
  this.dispatchEvent('powerChanged', { power: this._power });
};

Soul.prototype.getPower = function (power) {
  return this._power;
};

Soul.prototype.SPEED = 6.5;

Soul.prototype.followHope = function (t, dt) {
  if (this.hope) {
    var target = this.hope.position;
    this.lookAt(target);
    this.translateZ(this.SPEED*dt/1000);
  }
};

Object.defineProperty(Soul.prototype, 'lookAt', { get: function () {
  return this.render.soulMesh.lookAt.bind(this.render.soulMesh);
}});

Object.defineProperty(Soul.prototype, 'translateZ', { get: function () {
  return this.render.soulMesh.translateZ.bind(this.render.soulMesh);
}});

Soul.prototype.SIZE = 1.5;

Object.defineProperty(Soul.prototype, 'position', {
  get: function () { return this.render.soulMesh.position; }
});
