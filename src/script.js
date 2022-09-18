const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// Global variables
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;
let score = 0;
const winningScore = 50;

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPosition = [];
const projectiles = [];
const resources = [];

// Mouse
const mouse = {
  x: undefined,
  y: undefined,
  width: 0.1,
  height: 0.1,
}
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', function(e) {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave', function() {
  mouse.x = undefined;
  mouse.y = undefined;
})

// Game board
const controlsBar = {
  width: canvas.width,
  height: cellSize,
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
  }

  draw() {
    if(mouse.x && mouse.y && collision(this, mouse)) {
      ctx.strokeStyle = 'black';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}

function createGrid() {
  for(let y = cellSize; y < canvas.height; y += cellSize) {
    for(let x = 0; x < canvas.width; x += cellSize) {
      gameGrid.push(new Cell(x, y));
    }
  }
}

createGrid();
function handleGameGrid() {
  for(let i = 0; i < gameGrid.length; i++) {
    gameGrid[i].draw();
  }
}
//Projectiles
class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 10;
    this.power = 20;
    this.speed = 5;
  }

  update() {
    this.x += this.speed;
  }

  draw() {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    ctx.fill();
  }
}

function handleProjectiles() {
  for(let i = 0; i < projectiles.length; i++) {
    projectiles[i].update();
    projectiles[i].draw();

    for(let j = 0; j < enemies.length; j++) {
      if(enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])) {
        enemies[j].health -= projectiles[i].power;
        projectiles.splice(i, 1);
        i--;
      }
    }

    if(projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
      projectiles.splice(i, 1);
      i--;
    }
  }
}
// Defenders
class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.shooting = false;
    this.health = 100;
    this.projectiles = [];
    this.timer = 0;
  }
  draw() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'gold';
    ctx.font = '30px MedievalSharp';
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
  }

  update() {
    if(this.shooting) {
      this.timer++;
      if(this.timer % 100 === 0) {
        projectiles.push(new Projectile(this.x + 70, this.y + 50));
      }
    } else {
      this.timer = 0;
    }
  }
}
canvas.addEventListener('click', function() {
  const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
  const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
  if(gridPositionY < cellSize) return;
  for(let i = 0; i < defenders.length; i++) {
    if(defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) return;
  }
  let defenderCost = 100;
  if(numberOfResources >= defenderCost) {
    defenders.push(new Defender(gridPositionX, gridPositionY));
    numberOfResources -= defenderCost;
  }
})

function handleDefenders() {
  for(let i = 0; i < defenders.length; i++) {
    defenders[i].draw();
    defenders[i].update();

    if(enemyPosition.indexOf(defenders[i].y) !== -1) {
      defenders[i].shooting = true;
    } else {
      defenders[i].shooting = false;
    }

    for(let j = 0; j < enemies.length; j++) {
      if(defenders[i] && collision(defenders[i], enemies[j])) {
        enemies[j].movement = 0;
        defenders[i].health -= 0.2;
      }

      if(defenders[i] && defenders[i].health <= 0) {
        defenders.splice(i, 1);
        i--;
        enemies[j].movement = enemies[j].speed;
      }
    }
  }
}
// Enemies
class Enemy {
  constructor(verticalPosition) {
    this.x = canvas.width;
    this.y = verticalPosition;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = Math.random() * 0.2 + 0.4;
    this.movement = this.speed;
    this.health = 100;
    this.maxHealth = this.health;
  }

  update() {
    this.x -= this.movement;
  }

  draw() {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '30px MedievalSharp';
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
  }
}

function handleEnemies() {
  for(let i = 0; i < enemies.length; i++) {
    enemies[i].update();
    enemies[i].draw();
    if(enemies[i].x < 0) {
      gameOver = true;
    }
    if(enemies[i].health <= 0) {
      let gainedResources = enemies[i].maxHealth/10;
      numberOfResources += gainedResources;
      score += gainedResources;
      const findThisIndex = enemyPosition.indexOf(enemies[i].y);
      enemyPosition.splice(findThisIndex, 1)
      enemies.splice(i, 1);
      i--;
    }
  }

  if(frame % enemiesInterval === 0 && score < winningScore) {
    let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
    enemies.push(new Enemy(verticalPosition));
    enemyPosition.push(verticalPosition)
    if(enemiesInterval > 120) enemiesInterval -= 50;
  }
}
// Resources
const amounts = [20, 30, 40];
class Resource {
  constructor() {
    this.x = Math.random() * (canvas.width - cellSize);
    this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
    this.width = cellSize * 0.6;
    this.height = cellSize * 0.6;
    this.amount = amounts[Math.floor(Math.random() * amounts.length)];
  }

  draw() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px MedievalSharp';
    ctx.fillText(this.amount, this.x + 15, this.y + 25);
  }
}

function handleResources() {
  if(frame % 500 === 0 && score < winningScore) {
    resources.push(new Resource());
  }

  for(let i = 0; i < resources.length; i++) {
    resources[i].draw();
    if(resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
      numberOfResources += resources[i].amount;
      resources.splice(i, 1);
      i--;
    }
  }
}

// Utilities
function handleGameStatus() {
  ctx.fillStyle = 'gold';
  ctx.font = '30px MedievalSharp';
  ctx.fillText('Score: ' + score, 20, 40);
  ctx.fillText('Resources: ' + numberOfResources, 20, 80);

  if(gameOver) {
    ctx.fillStyle = 'black';
    ctx.font = '90px MedievalSharp';
    ctx.fillText('GAME OVER', 135, 330);
  }

  if(score >= winningScore && enemies.length === 0) {
    ctx.fillStyle = 'black';
    ctx.font = '60px MedievalSharp';
    ctx.fillText('LEVEL COMPLETE', 130, 300);
    ctx.font = '30px MedievalSharp';
    ctx.fillText('You win with ' + score + ' points!', 134, 340);
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'blue';
  ctx.fillRect(0,0,controlsBar.width, controlsBar.height);
  handleGameGrid();
  handleDefenders();
  handleResources();
  handleProjectiles();
  handleEnemies();
  handleGameStatus();
  frame++;
  if(!gameOver) requestAnimationFrame(animate);
}
animate();

function collision(first, second) {
  if(
    !(first.x > second.x + second.width ||
    first.x + first.width < second.x ||
    first.y > second.y + second.height ||
    first.y + first.height < second.y)
    ) {
    return true;
  };
}

window.addEventListener('resize', function() {
  canvasPosition = canvas.getBoundingClientRect();
})
