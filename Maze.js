
function MazeRender(maze) {
  Render.apply(this, arguments);

  this.maze = maze;
  this.verticalGeometry = new THREE.BoxGeometry(1, 8, this.maze.CELL_SIZE);
  this.verticalGeometry.applyMatrix(
    new THREE.Matrix4().makeTranslation(0.5, 4, this.maze.CELL_SEMI_SIZE)
  );
  this.horizontalGeometry = new THREE.BoxGeometry(this.maze.CELL_SIZE, 8, 1);
  this.horizontalGeometry.applyMatrix(
    new THREE.Matrix4().makeTranslation(this.maze.CELL_SEMI_SIZE, 4, 0.5)
  );
  this.wallMaterial = new THREE.MeshNormalMaterial();

  this.maze.addEventListener('mazeChanged', this.repaint.bind(this));
}
theClass(MazeRender).inheritsFrom(Render);

MazeRender.prototype.repaint = function (evt) {
  var geometriesByDirection = {
    N: this.horizontalGeometry,
    E: this.verticalGeometry,
    S: this.horizontalGeometry,
    W: this.verticalGeometry
  };

  GfxSystem.scene.remove(this.completeMaze);
  var mergedWalls = new THREE.Geometry();
  for (var c = 0; c < this.maze.columns; c++) {
    for (var r = 0; r < this.maze.rows; r++) {
      var cell = this.maze.getCell(c, r);
      var directions = ['N', 'W'];
      if (c === this.maze.columns - 1) { directions.push('E'); }
      if (r === this.maze.rows - 1) { directions.push('S'); }
      directions.forEach(function (d) {
        if (!cell.walls[d].isOpen) {
          var mesh =
            new THREE.Mesh(geometriesByDirection[d], this.wallMaterial);
          var oppositeOffsetCol = (d === 'E') ? 1 : 0;
          var oppositeOffsetRow = (d === 'S') ? 1 : 0;
          mesh.position.x +=
            (this.maze.CELL_SIZE * (c + oppositeOffsetCol));
          mesh.position.z +=
            (this.maze.CELL_SIZE * (r + oppositeOffsetRow));
          mesh.matrixAutoUpdate = false;
          mesh.updateMatrix();
          mergedWalls.merge(mesh.geometry, mesh.matrix);
        }
      }, this);
    }
  }

  mergedWalls.computeFaceNormals();
  this.completeMaze = new THREE.Mesh(mergedWalls, this.wallMaterial);
  GfxSystem.scene.add(this.completeMaze);
  //this.floorGeometry = new THREE.BoxGeometry(width, 1, height);
  //this.floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
  //this.floorMesh = new THREE.Mesh(this.floorGeometry, this.floorMaterial);

  //GfxSystem.scene.add(this.floorMesh);
};

function Maze(rows, columns) {
  Model.apply(this, arguments);

  this.rows = rows;
  this.columns = columns;
  this.width = this.columns * this.CELL_SIZE;
  this.height = this.rows * this.CELL_SIZE;
  this.reset();
  this.generate();
  this.fillWithSouls();
}
theClass(Maze).inheritsFrom(Model);

Maze.prototype.getSimulateSubmodels = function () { return this.souls; };

Maze.prototype.render = MazeRender;

Maze.prototype.CELL_SIZE = 16;

Maze.prototype.CELL_SEMI_SIZE = Maze.prototype.CELL_SIZE >>> 1;

Maze.prototype.EXITS = {
  N: 0,
  E: 1,
  S: 2,
  W: 3
};

// XXX: don't trust the order
Maze.prototype.DIRECTIONS = Object.keys(Maze.prototype.EXITS);

Maze.prototype.freeCell = function (cell) {
  this.DIRECTIONS.forEach(function (d) {
    cell.walls[d].isOpen = true;
  }, this);
};

Maze.prototype.fillWithSouls = function () {
  this.souls = [];
  for (var c = 0; c < this.columns; c++) {
    for (var r = 0; r < this.rows; r++) {
      if (Math.random() < 0.5) {
        var soul = new Soul();
        soul.position.x = c * this.CELL_SIZE + this.CELL_SEMI_SIZE;
        soul.position.y = 1;
        soul.position.z = r * this.CELL_SIZE + this.CELL_SEMI_SIZE;
        this.souls.push(soul);
      }
    }
  }
};

Maze.prototype.blowUp = function (column, row, radius) {
  var l = column - radius;
  var t = row - radius;
  var diameter = radius * 2;
  var center = column + row;
  for (var c = l; c <= diameter + column; c++) {
    for (var r = t; r <= diameter + row; r++) {
      if (c < 0 || c >= this.columns || r < 0 || r >= this.rows) { continue; }
      var inRadius = (Math.abs(column - c) + Math.abs(row - r)) <= radius;
      if (inRadius) {
        this.freeCell(this.graph[c][r]);
      }
    }
  }
  this.dispatchEvent('mazeChanged', {});
};

Maze.prototype.getCell = function (c, r) {
  var graph = this.graph;
  if (!graph) { return null; }

  var column = graph[c];
  if (!column) { return null; }

  var cell = column[r];
  return cell || null;
};

Maze.prototype.getMazeCoordinates = function (x, z) {
  var c = Math.floor(x / this.CELL_SIZE);
  var r = Math.floor(z / this.CELL_SIZE);
  return [c, r];
};

Maze.prototype.getCellCenter = function (c, r) {
  var x = this.CELL_SIZE * c + this.CELL_SEMI_SIZE;
  var y = 1;
  var z = this.CELL_SIZE * r + this.CELL_SEMI_SIZE;
  return new THREE.Vector3(x, y, z);
};

Maze.prototype.reset = function () {
  var N = 0, E = 1, S = 2, W = 3;
  var column, walls, neighbour;
  this.graph = [];
  for (var c = 0; c < this.columns; c++) {
    column = [];
    this.graph.push(column);
    for (var r = 0; r < this.rows; r++) {
      walls = {};

      neighbour = this.getCell(c, r-1);
      walls.N = neighbour ? neighbour.walls.S : Wall.makeBound();
      walls.E = (c === this.columns - 1) ? Wall.makeBound() : new Wall();
      walls.S = (r === this.rows - 1) ? Wall.makeBound() : new Wall();
      neighbour = this.getCell(c-1, r);
      walls.W = neighbour ? neighbour.walls.E : Wall.makeBound();

      column.push(new Cell(r, c, walls));
    }
  }
};

Maze.prototype.getNeighbour = function (direction, current) {
  var neighbour = { column: current.column, row: current.row };
  switch (direction) {
    case 'N':
      neighbour.row--;
      break;
    case 'E':
      neighbour.column++;
      break;
    case 'S':
      neighbour.row++;
      break;
    case 'W':
      neighbour.column--;
      break;
  }
  if (neighbour.column < 0 || neighbour.row < 0 ||
      neighbour.column >= this.columns || neighbour.row >= this.rows) {
    neighbour = null;
  }
  return neighbour && this.graph[neighbour.column][neighbour.row];
};

Maze.prototype.getRandomNeighbour = function (current, select) {
  select = select || function (choices, value) {
    return choices[Math.floor(Math.random() * choices.length)];
  };
  var direction, neighbour;
  do {
    direction = select(this.DIRECTIONS, Math.random());
    neighbour = this.getNeighbour(direction, current);
  } while (!neighbour);
  return neighbour;
};

Maze.prototype.getRandomUnvisitedNeighbour = function (current, select) {
  var neighbour;
  do {
    neighbour = this.getRandomNeighbour(current, select);
  } while (neighbour.isVisited);
  return neighbour;
};

Maze.prototype.isDeadEnd = function (current) {
  var neighbourhood = this.DIRECTIONS.map(function (d) {
    return this.getNeighbour(d, current);
  }, this);

  return neighbourhood.every(function (n) {
    return !n || n.isVisited;
  });
};

Maze.prototype.connect = function (cellA, cellB) {
  if (!cellA || !cellB) {
    throw new Error('Some cells are null');
  }

  var N = 0, E = 1, S = 2, W = 3;
  if (cellA.row + 1 === cellB.row) {
    cellA.walls.S.isOpen = true;
  }
  else if (cellA.column - 1 === cellB.column) {
    cellA.walls.W.isOpen = true;
  }
  else if (cellA.row - 1 === cellB.row) {
    cellA.walls.N.isOpen = true;
  }
  else if (cellA.column + 1 === cellB.column) {
    cellA.walls.E.isOpen = true;
  }
  else {
    throw new Error('Cells are not adjacent');
  }
};

Maze.prototype.generate = function () {
  var stack = [],
      unvisited = this.columns * this.rows;

  var rndCol = Math.floor(Math.random() * this.columns);
  var rndRow = Math.floor(Math.random() * this.rows);
  var current = this.graph[rndCol][rndRow];
  stack.push(current);

  var spiral = function () {
    var next = 0;
    return function (choices, value) {
      var most = choices[next];
      var remaining = choices.slice(0);
      remaining.splice(next, 1);
      next = (next + 1) % choices.length;

      var result = value < 0.75 ? most :
                   remaining[Math.floor(Math.random() * remaining.length)];

      return result;
    };
  };

  var verticalFlavor = function (choices, value) {
    if (value < 0.75) {
      return Math.floor(Math.random() * 2) ? 'N' : 'S';
    }
    else {
      return Math.floor(Math.random() * 2) ? 'E' : 'W';
    }
  }.bind(this);

  var neighbour;
  do {
    if (this.isDeadEnd(current)) {
      current = stack.pop();
    }
    else {
      neighbour = this.getRandomUnvisitedNeighbour(current, verticalFlavor);
      neighbour.isVisited = true;
      this.connect(current, neighbour);
      current = neighbour;
      stack.push(current);
    }
  } while (stack.length > 0);

  this.dispatchEvent('mazeChanged', {});
};

function Cell(row, column, walls) {
  this.row = row;
  this.column = column;
  this.isVisited = false;
  this.walls = walls;
}

function Wall() {
  this.isOpen = false;
  this.isBound = false;
}

Wall.makeBound = function (wall) {
  var bound = wall || new Wall();
  bound.isBound = true;
  Object.freeze(bound);
  return bound;
};
