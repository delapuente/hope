
function Hope() {
  Model.apply(this, arguments);

  this.maze = new Maze(10, 10);
  this.player = new Player(this.maze);
  this.maze.addEventListener('mazeBlownUp', this.onmazeblow.bind(this));

  var cameraPosition = GfxSystem.camera.position;
  var mazeCenter =
    new THREE.Vector3(this.maze.width / 2, 0, this.maze.height / 2);
  GfxSystem.camera.position.x = mazeCenter.x;
  GfxSystem.camera.position.z = mazeCenter.z + 150;
  GfxSystem.camera.position.y = 150;
  GfxSystem.camera.lookAt(mazeCenter);

  this.startLevel(1);
}
theClass(Hope).inheritsFrom(Model);

Hope.prototype.onmazeblow = function (evt) {
  var wallCount = evt.removed.length;
  if (evt.removed.length && this.storyFragments.length) {
    var random = Math.floor(Math.random() * wallCount);
    evt.removed[random].tellAStory(this.storyFragments.shift());
  }
};

Hope.prototype.leaveStory = function (evt) {
  console.log(this.storyFragments.shift());
};

Hope.prototype.startLevel = function (number) {
  this.storyFragments = this.story[number - 1].slice(0);
};

Hope.prototype.story = [
  [
    'The last of us...',
    'Quick! Look for the light!'
  ],

  [
    'We are the Old Kind',
    'The Youngers casted us here'
  ],

  [
    'Are you lost?',
    'Come with me'
  ],

  [
    'Be my friend',
    'I\'m your friend'
  ],

  [
    'The darkness changed us',
    'We are hungry'
  ],

  [
    'Run, run, run!',
    'Where are you?'
  ],

  [
    'It is so cold',
    'No light here'
  ],

  [
    'It is so cold',
    'What is that?'
  ]
];

Hope.prototype.getSubmodels = function () { return [this.maze, this.player]; };

Hope.prototype.render = GfxSystem.render.bind(GfxSystem);

Hope.prototype.simulate = function (isPostStep, t, dt) {
};
