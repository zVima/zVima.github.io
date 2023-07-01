const canvas = document.getElementById('boids-canvas');
const context = canvas.getContext('2d');

let cursor = document.getElementById('cursor');
let innerCursor = document.getElementById('inner-cursor');

const logFps = false;

const drawBoidsRange =  false;
const highlightBoidsInRange = false;

const qTreeCapacity = 10;

const boidSize = 16;

const numOfBoids = 5000;

const minSpeed = .1;
const maxSpeed = .8;
const turnFactor = 0.1;

const detectionRange = 40;
const seperationRange = 8;
const mouseAvoidanceRange = 30;

const seperationWeight = 0.8;
const alignmentWeight = 0.3;
const cohesionWeight = 0.0005;

const edgeMargin = 50;

const boids = [];

let section;
let width;
let height;

let boundary;
let qTree;

let mouseX = 0;
let mouseY = 0;

let mousedown = false;

document.addEventListener('mousemove', function(event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

document.addEventListener('mousedown', function() {
  mousedown = true;
});

document.addEventListener('mouseup', function() {
  mousedown = false;
});

function updateCanvas() {
  section = document.getElementById('start-container').getBoundingClientRect();
  width = section.width;
  height = section.height;
  canvas.height = height;
  canvas.width = width;
}

function createBoid() {
  const position = new Vector2D(Math.random() * width, Math.random() * height);
  const velocity = new Vector2D(Math.random() * 2 - 1, Math.random() * 2 - 1);

  let boid = new Boid(position, velocity, boidSize);
  boids.push(boid);

  qTree.insert(boid);
}

function createQuadTree() {
  boundary = new Rectangle(0, 0, width, height);
  qTree = new QuadTree(boundary, qTreeCapacity);
}

function updateBoids() {
  updateCanvas();
  createQuadTree();

  context.clearRect(0, 0, width, height);

  // Update and draw each boid
  for (const boid of boids) {
    qTree.insert(boid);

    let range = new Rectangle(boid.position.x - detectionRange / 2, boid.position.y - detectionRange / 2, detectionRange, detectionRange);
    let boidsInRange = [];
    qTree.query(range, boidsInRange);


    if (mousedown) {
      boid.velocity.x = mouseX - boid.position.x;
      boid.velocity.y = mouseY - boid.position.y;
    }

    if (Math.sqrt(Math.pow(mouseY - boid.position.y, 2) + Math.pow(mouseX - boid.position.x, 2)) <= mouseAvoidanceRange) {
      const oppositevx = -(mouseX - boid.position.x);
      const oppositevy = -(mouseY - boid.position.y);

      boid.velocity.x = oppositevx;
      boid.velocity.y = oppositevy;

      limitVelocity(boid);

      const x = boid.position.x - (boid.size / 2);
      const y = boid.position.y - (boid.size / 2);

      context.beginPath();
      context.fillStyle = "rgba(58, 162, 210, .5)";
      context.rect(x, y, boid.size, boid.size);
      context.fill();
    } else {
      nextMove(boid, boidsInRange);
    }


    boid.update(width, height, turnFactor, edgeMargin);
    boid.draw(context);

    if (drawBoidsRange) {
      drawBoidRange(boid);
    }
    if (highlightBoidsInRange) {
      drawNearbyBoids(boid, boidsInRange);
    }
  }

  if (logFps) {
    logFPS();
  }

  qTree.show(context);
  requestAnimationFrame(updateBoids);
}


function nextMove(currentBoid, nearbyBoids) {
  let seperation = new Vector2D(0, 0);
  let alignment = new Vector2D(0, 0);
  let cohesion = new Vector2D(0, 0);
  let nearbyBoidCount = 0;

  for (let boid of nearbyBoids) {
    if (currentBoid !== boid) {
      nearbyBoidCount++;

      if (currentBoid.position.distance(boid.position) <= seperationRange) {
        seperation.x += currentBoid.position.x - boid.position.x;
        seperation.y += currentBoid.position.y - boid.position.y;
      } else {
        alignment.x += boid.velocity.x;
        alignment.y += boid.velocity.y;
  
        cohesion.x += boid.position.x;
        cohesion.y += boid.position.y;
      }

    }
  }

  if (nearbyBoidCount > 0) {
    alignment.x = alignment.x / nearbyBoidCount;
    alignment.y = alignment.y / nearbyBoidCount;
    cohesion.x = cohesion.x / nearbyBoidCount;
    cohesion.y = cohesion.y / nearbyBoidCount;
  
    cohesion.x = cohesion.x - currentBoid.position.x;
    cohesion.y = cohesion.y - currentBoid.position.y;

    currentBoid.velocity.x += alignment.x * alignmentWeight;
    currentBoid.velocity.y += alignment.y * alignmentWeight;
  
    currentBoid.velocity.x += cohesion.x * cohesionWeight;
    currentBoid.velocity.y += cohesion.y * cohesionWeight;
  }

  currentBoid.velocity.x += seperation.x * seperationWeight;
  currentBoid.velocity.y += seperation.y * seperationWeight;

  limitVelocity(currentBoid);
}

function limitVelocity(boid) {
  let speed = Math.sqrt(boid.velocity.x * boid.velocity.x + boid.velocity.y * boid.velocity.y);

  if (speed > maxSpeed) {
    boid.velocity.x = (boid.velocity.x / speed) * maxSpeed;
    boid.velocity.y = (boid.velocity.y / speed) * maxSpeed;
  } else if (speed < minSpeed) {
    boid.velocity.x = (boid.velocity.x / speed) * minSpeed;
    boid.velocity.y = (boid.velocity.y / speed) * minSpeed;
  }
}


function drawBoidRange(boid) {
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = "rgba(0, 255, 0, .2)";
  context.rect(boid.position.x - detectionRange / 2, boid.position.y - detectionRange / 2, detectionRange, detectionRange);
  context.stroke();
}

function drawNearbyBoids(currentBoid, nearbyBoids) {
  for (let boid of nearbyBoids) {
    if (boid !== currentBoid) {
      const x = boid.position.x - (boid.size / 2);
      const y = boid.position.y - (boid.size / 2);

      context.beginPath();
      context.fillStyle = "green";
      context.rect(x, y, boid.size, boid.size);
      context.fill();
    }
  }
}

let prevTime = Date.now();
let frames = 0;
let calculatedFps = [];

function logFPS() {
  const time = Date.now();
  frames++;
  if (time > prevTime + 1000) {
    let fps = Math.round((frames * 1000) / (time - prevTime));
    prevTime = time;
    frames = 0;

    calculatedFps.push(fps);
    // console.info('FPS: ', fps);

    let countedFrames = 0;
    calculatedFps.forEach(frame => countedFrames += frame);
    console.info('avg. FPS: ', Math.round(countedFrames / calculatedFps.length));
  }
}

updateCanvas();
createQuadTree();

for (let i = 0; i < numOfBoids; i++) {
  createBoid();
}

updateBoids();
