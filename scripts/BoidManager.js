import * as THREE from 'three';

const boidSize = 0.02;
const boidColor = new THREE.Color(1, 1, 1);
const boidsCount = 4000;

const logFps = false;

const qTreeCapacity = 10;

const minSpeed = 1;
const maxSpeed = 2;
const turnFactor = 0.075;

const detectionRange = 40;
const seperationRange = 12;
const mouseDetectionRange = 400;
const mouseAvoidanceRange = 40;

const seperationWeight = 0.8;
const alignmentWeight = 0.3;
const cohesionWeight = 0.1;

const edgeMargin = 50;

let boundary;
let qTree;

let mouseX, mouseY, mousedown;

const boids = [];
const boidsParticlePositions = new Float32Array(boidsCount * 3);
const boidsParticleColors = new Float32Array(boidsCount * 3);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#boids-canvas')
});

renderer.setSize(window.innerWidth, window.innerHeight);

camera.position.z = 5;

for (let i = 0; i < boidsCount; i++) {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  const position = new THREE.Vector2(x, y);
  const velocity = new THREE.Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1);
  const acceleration = new THREE.Vector2(0, 0);
  const boid = new Boid(position, velocity, acceleration, boidColor);
  boids.push(boid);

  const ndcX = (x / window.innerWidth) * 2 - 1;
  const ndcY = -(y / window.innerHeight) * 2 + 1;
  let ndcVector = new THREE.Vector3(ndcX, ndcY, 0.5);
  ndcVector.unproject(camera);

  boidsParticlePositions[i * 3] = ndcVector.x;
  boidsParticlePositions[i * 3 + 1] = ndcVector.y;
  boidsParticlePositions[i * 3 + 2] = ndcVector.z;

  boidsParticleColors[i * 3] = boidColor.r;
  boidsParticleColors[i * 3 + 1] = boidColor.g;
  boidsParticleColors[i * 3 + 2] = boidColor.b;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(boidsParticlePositions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(boidsParticleColors, 3));

const particleMaterial = new THREE.PointsMaterial({
  size: boidSize,
  transparent: true,
  opacity: 0.15,
  vertexColors: true
});

const particles = new THREE.Points(particleGeometry, particleMaterial);

scene.add(particles);


document.addEventListener('mousemove', function (event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

document.addEventListener('mousedown', function () {
  mousedown = true;
});

document.addEventListener('mouseup', function () {
  mousedown = false;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;

  renderer.setSize(window.innerWidth, window.innerHeight);
});


function createQuadTree() {
  boundary = new Rectangle(0, 0, window.innerWidth, window.innerHeight);
  qTree = new QuadTree(boundary, qTreeCapacity);

  for (let boid of boids) {
    qTree.insert(boid);
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


function animate() {
  requestAnimationFrame(animate);

  createQuadTree();

  // Update and draw each boid
  for (let i = 0; i < boidsCount; i++) {
    const boid = boids[i];

    let range = new Rectangle(boid.position.x - detectionRange / 2, boid.position.y - detectionRange / 2, detectionRange, detectionRange);
    let boidsInRange = [];
    qTree.query(range, boidsInRange);

    let desiredVelocity = nextMove(boid, boidsInRange);

    let mouseDistSquared = (boid.position.x - mouseX) * (boid.position.x - mouseX) + (boid.position.y - mouseY) * (boid.position.y - mouseY);

    if (Math.sqrt(mouseDistSquared) <= mouseAvoidanceRange) {
      const oppositevx = -(mouseX - boid.position.x);
      const oppositevy = -(mouseY - boid.position.y);

      desiredVelocity.x += oppositevx;
      desiredVelocity.y += oppositevy;
    } else if (mousedown && mouseDistSquared <= mouseDetectionRange * mouseDetectionRange) {
      desiredVelocity.x += mouseX - boid.position.x;
      desiredVelocity.y += mouseY - boid.position.y;
    }

    limitVelocity(desiredVelocity);

    if (desiredVelocity.x != 0 && desiredVelocity.y != 0) {
      let velocityDifference = desiredVelocity.clone().sub(boid.velocity);
      if (velocityDifference.length() > turnFactor) {
        velocityDifference.multiplyScalar(turnFactor);
      }


      boid.acceleration = velocityDifference;
    }

    boid.update(window.innerWidth, window.innerHeight, turnFactor, edgeMargin);


    const ndcX = (boid.position.x / window.innerWidth) * 2 - 1;
    const ndcY = -(boid.position.y / window.innerHeight) * 2 + 1;
    let ndcVector = new THREE.Vector3(ndcX, ndcY, 0.5);
    ndcVector.unproject(camera);

    boidsParticlePositions[i * 3] = ndcVector.x;
    boidsParticlePositions[i * 3 + 1] = ndcVector.y;
    boidsParticlePositions[i * 3 + 2] = ndcVector.z;

    boidsParticleColors[i * 3] = boid.color.r;
    boidsParticleColors[i * 3 + 1] = boid.color.g;
    boidsParticleColors[i * 3 + 2] = boid.color.b;
  }

  if (logFps) {
    logFPS();
  }

  /*     qTree.show(context); */

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(boidsParticlePositions, 3));

  renderer.render(scene, camera);
}

function nextMove(currentBoid, nearbyBoids) {
  let desiredVelocity = new THREE.Vector2(0, 0);

  let separation = new THREE.Vector2(0, 0);
  let avgVelocity = new THREE.Vector2(0, 0);
  let avgPosition = new THREE.Vector2(0, 0);
  let nearbyBoidCount = 0;

  for (let boid of nearbyBoids) {

    let dx = currentBoid.position.x - boid.position.x;
    let dy = currentBoid.position.y - boid.position.y;

    if (currentBoid !== boid && Math.abs(dx) <= detectionRange && Math.abs(dy) <= detectionRange) {
      let squaredDistance = dx * dx + dy * dy;

      if (squaredDistance <= (seperationRange * seperationRange)) {
        separation.x += currentBoid.position.x - boid.position.x;
        separation.y += currentBoid.position.y - boid.position.y;
      } else if (squaredDistance <= (detectionRange * detectionRange)) {

        avgVelocity.x += boid.velocity.x;
        avgVelocity.y += boid.velocity.y;

        avgPosition.x += boid.position.x;
        avgPosition.y += boid.position.y;

        nearbyBoidCount++;
      }

    }
  }

  if (nearbyBoidCount > 0) {
    avgPosition.x /= nearbyBoidCount;
    avgPosition.y /= nearbyBoidCount;
    avgVelocity.x /= nearbyBoidCount;
    avgVelocity.y /= nearbyBoidCount;

    avgPosition.x -= currentBoid.position.x;
    avgPosition.y -= currentBoid.position.y;
    avgVelocity.x -= currentBoid.velocity.x;
    avgVelocity.y -= currentBoid.velocity.y;

    avgPosition.x = (avgPosition.x * cohesionWeight);
    avgPosition.y = (avgPosition.y * cohesionWeight);

    avgVelocity.x = (avgVelocity.x * alignmentWeight);
    avgVelocity.y = (avgVelocity.y * alignmentWeight);

    desiredVelocity.x += avgPosition.x;
    desiredVelocity.y += avgPosition.y;
    desiredVelocity.x += avgVelocity.x;
    desiredVelocity.y += avgVelocity.y;
  }

  separation.x = (separation.x * seperationWeight);
  separation.y = (separation.y * seperationWeight);

  desiredVelocity.x += separation.x;
  desiredVelocity.y += separation.y;

  const seperationMagnitude = separation.length();
  const cohesionMagnitude = avgPosition.length();
  const alignmentMagnitude = avgVelocity.length();

  if (seperationMagnitude >= cohesionMagnitude && seperationMagnitude >= alignmentMagnitude) {
    currentBoid.color.set("#6fc4e8");
  } else if (cohesionMagnitude >= seperationMagnitude && cohesionMagnitude >= alignmentMagnitude) {
    currentBoid.color.set("#185cdb");
  } else {
    currentBoid.color.set("#05095e");
  }

  return desiredVelocity;
}

function limitVelocity(desiredVelocity) {
  let speed = Math.sqrt(desiredVelocity.x * desiredVelocity.x + desiredVelocity.y * desiredVelocity.y);

  if (speed > maxSpeed) {
    desiredVelocity.x = (desiredVelocity.x / speed) * maxSpeed;
    desiredVelocity.y = (desiredVelocity.y / speed) * maxSpeed;
  } else if (speed > 0 && speed < minSpeed) {
    desiredVelocity.x = (desiredVelocity.x / speed) * minSpeed;
    desiredVelocity.y = (desiredVelocity.y / speed) * minSpeed;
  }
}

animate();
