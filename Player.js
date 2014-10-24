
function PlayerRender() {
  var playerGeometry = new THREE.CylinderGeometry(1, 3, 3, 4);
  playerGeometry.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI/4));
  playerGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI/2));
  playerGeometry.computeFaceNormals();
  this.playerMaterial = new THREE.MeshNormalMaterial();
  this.playerMesh = new THREE.Mesh(playerGeometry, this.playerMaterial);

  GfxSystem.scene.add(this.playerMesh);
}
theClass(PlayerRender).inheritsFrom(Render);

function PlayerControl(player) {
  Simulator.apply(this, arguments);
  this.player = player;
  window.addEventListener('keydown', this.onkeydown.bind(this));
  window.addEventListener('keyup', this.onkeyup.bind(this));
}
theClass(PlayerControl).inheritsFrom(Simulator);

PlayerControl.prototype.onkeydown = function (evt) {
  if (evt.which === 87) {
    this.player.advance(true);
  }
  if (evt.which === 83) {
    this.player.goBack(true);
  }
  if (evt.which === 68) {
    this.player.turnLeft(true);
  }
  if (evt.which === 65) {
    this.player.turnRight(true);
  }
  if (evt.which === 32) {
    this.player.cast(true);
  }
};

PlayerControl.prototype.onkeyup = function (evt) {
  if (evt.which === 87) {
    this.player.advance(false);
  }
  if (evt.which === 83) {
    this.player.goBack(false);
  }
  if (evt.which === 68) {
    this.player.turnLeft(false);
  }
  if (evt.which === 65) {
    this.player.turnRight(false);
  }
  if (evt.which === 32) {
    this.player.cast(false);
  }
  if (evt.which === 81) {
    this.player.blowUpMaze();
  }
};

PlayerControl.prototype.ADVANCE_SPEED = 7;
PlayerControl.prototype.GOING_BACK_SPEED = 4;

PlayerControl.prototype.simulate = function (player, t, dt) {
  if (player.isAdvancing && player.canAdvance())  {
    player.translateZ(-this.ADVANCE_SPEED*dt/1000);
  }
  else if (player.isGoingBack && player.canGoBack()) {
    player.translateZ(this.GOING_BACK_SPEED*dt/1000);
  }
  if (player.isTurningLeft) {
    player.rotation.y -= Math.PI*dt/1000;
  }
  else if (player.isTurningRight) {
    player.rotation.y += Math.PI*dt/1000;
  }

  player.checkNearSoul();
  if (player.nearSoul) {
    player.recoverSoul(player.nearSoul);
  }
};

function Player(maze) {
  this.maze = maze;
  Model.apply(this, arguments);
  var startingPosition =
    this.maze.getCellCenter(this.maze.columns - 1, this.maze.rows - 1);
  this.position.set(startingPosition.x, startingPosition.y, startingPosition.z);
}
theClass(Player).inheritsFrom(Model);

Player.prototype.render = PlayerRender;

Player.prototype.simulate = PlayerControl;

Player.prototype.blowUpMaze = function () {
  if (this.recoveredSouls) {
    var totalPower = this.recoveredSouls.reduce(function (power, soul) {
      return power + soul.getPower();
    }, 0);
    var radius = Math.floor(Math.sqrt(totalPower / Math.PI));
    if (radius > 0) {
      console.log('Blowing radius: ' + radius);
      var center =
        this.maze.getMazeCoordinates(this.position.x, this.position.z);
      this.maze.blowUp(center[0], center[1], radius);
    }
  }
};

Object.defineProperty(Player.prototype, 'position', {
  get: function () { return this.render.playerMesh.position; },
});

Object.defineProperty(Player.prototype, 'rotation', {
  get: function () { return this.render.playerMesh.rotation; }
});

Object.defineProperty(Player.prototype, 'matrix', {
  get: function () { return this.render.playerMesh.matrix; }
});

Object.defineProperty(Player.prototype, 'translateZ', {
  get: function () {
    return this.render.playerMesh.translateZ.bind(this.render.playerMesh);
  }
});

Player.prototype.goBack = function (enable) {
  this.isGoingBack = enable;
  this.isAdvancing = false;
};

Player.prototype.advance = function (enable) {
  this.isGoingBack = false;
  this.isAdvancing = enable;
};

Player.prototype.turnRight = function (enable) {
  this.isTurningRight = enable;
  this.isTurningLeft = false;
};

Player.prototype.turnLeft = function (enable) {
  this.isTurningRight = false;
  this.isTurningLeft = enable;
};

Player.prototype.cast = function (enable) {
  this.isCasting = enable;
};

Player.prototype.RADIUS = 3;

Player.prototype.canAdvance = function () {
  var matrix = new THREE.Quaternion();
  matrix.setFromRotationMatrix(this.matrix);
  var direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(matrix);
  var rayCaster = new THREE.Raycaster(this.position, direction);
  var intersections = rayCaster.intersectObject(this.maze.render.completeMaze);
  return !intersections ||
         !intersections.length ||
         intersections[0].distance > this.RADIUS;
};

Player.prototype.canGoBack = function () {
  var matrix = new THREE.Quaternion();
  matrix.setFromRotationMatrix(this.render.playerMesh.matrix);
  var direction = new THREE.Vector3(0, 0, 1);
  direction.applyQuaternion(matrix);
  var rayCaster = new THREE.Raycaster(this.position, direction);
  var intersections = rayCaster.intersectObject(this.maze.render.completeMaze);
  return !intersections ||
         !intersections.length ||
         intersections[0].distance > this.RADIUS;
};

Player.prototype.checkNearSoul = function () {
  this.nearSoul = null;
  for (var i = 0, soul; (soul = this.maze.souls[i]); i++) {
    if (soul.hope === null &&
        soul.position.distanceTo(this.position) < this.RADIUS) {
      this.nearSoul = soul;
      return;
    }
  }
};

Player.prototype.recoverSoul = function (soul) {
  this.recoveredSouls = this.recoveredSouls || [];
  if (this.recoveredSouls.length > 0) {
    soul.hope = this.recoveredSouls[this.recoveredSouls.length - 1];
  }
  else {
    soul.hope = this;
  }
  this.recoveredSouls.push(soul);
};
