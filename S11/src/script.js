import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Ammo from "ammojs-typed";
import TWEEN from "@tweenjs/tween.js"; // ⭐ Instalar: npm install @tweenjs/tween.js

// Variables globales
let camera, scene, renderer, controls;
let physicsWorld;
let clock;
let ball = null;
let pins = [];
let bonusTargets = []; // ⭐ Objetivos bonus
let pinsKnockedDown = 0;

// Variables para el lanzamiento con ratón
const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

// Variables para física
const rigidBodies = [];
let transformAux1;
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const margin = 0.05;

// Constantes
const gravityConstant = 9.8;

Ammo(Ammo).then(start);

function start() {
  console.log("Ammo cargado");

  initGraphics();
  initPhysics();
  createObjects();
  initInput();
  animate();
}

function initGraphics() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 8, 15);
  camera.lookAt(0, 0, -5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true;
  controls.target.set(0, 0, -5);
  controls.update();

  clock = new THREE.Clock();

  // Luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  window.addEventListener("resize", onWindowResize);

  console.log("Gráficos inicializados");
}

function initPhysics() {
  const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  const broadphase = new Ammo.btDbvtBroadphase();
  const solver = new Ammo.btSequentialImpulseConstraintSolver();

  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );

  physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));
  transformAux1 = new Ammo.btTransform();

  console.log("Física inicializada");
}

function createBoxWithPhysics(sx, sy, sz, mass, pos, quat, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.copy(pos);
  mesh.quaternion.copy(quat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );
  shape.setMargin(margin);

  createRigidBody(mesh, shape, mass, pos, quat);

  return mesh;
}

function createSphereWithPhysics(radius, mass, pos, material) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    material
  );
  mesh.position.copy(pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const shape = new Ammo.btSphereShape(radius);
  shape.setMargin(margin);

  createRigidBody(mesh, shape, mass, pos, quat);

  return mesh;
}

function createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

  const motionState = new Ammo.btDefaultMotionState(transform);

  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    physicsShape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);
  body.setFriction(0.5);

  if (vel) {
    body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
  }

  if (angVel) {
    body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
  }

  object.userData.physicsBody = body;
  object.userData.knocked = false; // para rastrear si fue derribado

  scene.add(object);

  if (mass > 0) {
    rigidBodies.push(object);
    body.setActivationState(4);
  }

  physicsWorld.addRigidBody(body);

  return body;
}

function createObjects() {
  // Suelo
  pos.set(0, -0.5, 0);
  quat.set(0, 0, 0, 1);

  const ground = createBoxWithPhysics(
    15,
    1,
    30,
    0,
    pos,
    quat,
    new THREE.MeshPhongMaterial({ color: 0x8b7355 })
  );

  console.log(" Suelo creado");

  createPins();
  createBonusTargets(); // crear los otros objetos
  createBall();
}

function createPins() {
  const pinWidth = 0.4;
  const pinHeight = 1.5;
  const pinDepth = 0.4;
  const pinMass = 1.5;

  const startZ = -12;
  const spacing = 0.6;

  const pinMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

  for (let row = 0; row < 4; row++) {
    const pinsInRow = row + 1;
    const rowOffsetX = -(pinsInRow - 1) * spacing * 0.5;

    for (let col = 0; col < pinsInRow; col++) {
      const x = rowOffsetX + col * spacing;
      const z = startZ - row * spacing * 0.866;

      pos.set(x, pinHeight * 0.5, z);
      quat.set(0, 0, 0, 1);

      const pin = createBoxWithPhysics(
        pinWidth,
        pinHeight,
        pinDepth,
        pinMass,
        pos,
        quat,
        pinMaterial
      );

      pin.userData.isPin = true;
      pins.push(pin);
    }
  }

  console.log(`${pins.length} bolos creados`);
}

// NUEVA FUNCIÓN: Crear objetivos bonus giratorios
function createBonusTargets() {
  const targetSize = 0.8;
  const targetMass = 2;

  // Posiciones a los lados de los bolos
  const positions = [
    { x: -3, z: -10 },
    { x: 3, z: -10 },
    { x: -4, z: -6 },
    { x: 4, z: -6 },
  ];

  positions.forEach((targetPos, index) => {
    pos.set(targetPos.x, targetSize * 0.5, targetPos.z);
    quat.set(0, 0, 0, 1);

    const target = createBoxWithPhysics(
      targetSize,
      targetSize,
      targetSize,
      targetMass,
      pos,
      quat,
      new THREE.MeshPhongMaterial({
        color: 0xffaa00,
        emissive: 0xff6600,
        emissiveIntensity: 0.5,
      })
    );

    target.userData.isBonus = true;
    target.userData.originalColor = 0xffaa00;
    bonusTargets.push(target);

    // Animación de rotación y levitación
    animateBonusTarget(target, index);
  });

  console.log("Objetivos bonus creados");
}

// Animar objetivos bonus
function animateBonusTarget(target, index) {
  const startY = target.position.y;
  const delay = index * 500; // Desfase entre animaciones

  // Levitación
  new TWEEN.Tween(target.position)
    .to({ y: startY + 0.5 }, 1500)
    .easing(TWEEN.Easing.Sinusoidal.InOut)
    .delay(delay)
    .yoyo(true)
    .repeat(Infinity)
    .start();

  // Rotación
  new TWEEN.Tween(target.rotation)
    .to({ y: Math.PI * 2 }, 3000)
    .delay(delay)
    .repeat(Infinity)
    .start();
}

// Animación cuando un bolo cae
function animatePinKnockdown(pin) {
  if (pin.userData.knocked) return;

  pin.userData.knocked = true;
  pinsKnockedDown++;

  // Cambio de color del bolo
  new TWEEN.Tween(pin.material.color)
    .to({ r: 1, g: 0, b: 0 }, 300)
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

  // Efecto de escala
  const originalScale = { x: 1, y: 1, z: 1 };
  new TWEEN.Tween(pin.scale)
    .to({ x: 1.2, y: 1.2, z: 1.2 }, 200)
    .easing(TWEEN.Easing.Elastic.Out)
    .yoyo(true)
    .repeat(1)
    .start();

  console.log(`Bolo derribado! Total: ${pinsKnockedDown}/${pins.length}`);

  // STRIKE - Cuando se derriban todos los bolos
  if (pinsKnockedDown === pins.length) {
    celebrateStrike();
  }
}

// Animación cuando se golpea un objetivo bonus
function animateBonusHit(target) {
  if (target.userData.bonusHit) return;

  target.userData.bonusHit = true;

  // Explosión de color
  new TWEEN.Tween(target.material.emissiveIntensity)
    .to({ value: 2 }, 200)
    .yoyo(true)
    .repeat(3)
    .onComplete(() => {
      // Hacer desaparecer el objetivo
      new TWEEN.Tween(target.scale)
        .to({ x: 0, y: 0, z: 0 }, 500)
        .easing(TWEEN.Easing.Back.In)
        .onComplete(() => {
          scene.remove(target);
        })
        .start();
    })
    .start();

  // Rotación rápida
  new TWEEN.Tween(target.rotation)
    .to(
      {
        x: target.rotation.x + Math.PI * 4,
        y: target.rotation.y + Math.PI * 4,
      },
      500
    )
    .easing(TWEEN.Easing.Exponential.Out)
    .start();

  console.log("¡Objetivo bonus golpeado!");
}

// Celebración de strike
function celebrateStrike() {
  console.log("¡¡¡STRIKE!!!");

  // Shake de cámara
  const originalPos = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };

  new TWEEN.Tween(camera.position)
    .to({ y: originalPos.y + 0.5 }, 100)
    .easing(TWEEN.Easing.Bounce.Out)
    .yoyo(true)
    .repeat(5)
    .onComplete(() => {
      // Zoom dramático
      new TWEEN.Tween(camera.position)
        .to({ z: originalPos.z - 3 }, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .yoyo(true)
        .repeat(1)
        .start();
    })
    .start();

  // Cambiar color de fondo
  new TWEEN.Tween(scene.background)
    .to({ r: 1, g: 0.84, b: 0 }, 500)
    .yoyo(true)
    .repeat(3)
    .start();
}

function createBall() {
  const ballRadius = 0.5;
  const ballMass = 5;

  pos.set(0, ballRadius, 8);

  ball = createSphereWithPhysics(
    ballRadius,
    ballMass,
    pos,
    new THREE.MeshPhongMaterial({ color: 0x2020ff })
  );

  console.log(" Bola creada");
}

function initInput() {
  window.addEventListener("pointerdown", function (event) {
    if (event.button !== 0) return;

    mouseCoords.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouseCoords, camera);

    const ballMass = 5;
    const ballRadius = 0.5;
    const newBall = new THREE.Mesh(
      new THREE.SphereGeometry(ballRadius, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x2020ff })
    );
    newBall.castShadow = true;
    newBall.receiveShadow = true;

    const ballShape = new Ammo.btSphereShape(ballRadius);
    ballShape.setMargin(margin);

    pos.copy(raycaster.ray.direction);
    pos.add(raycaster.ray.origin);

    quat.set(0, 0, 0, 1);

    const velocity = new THREE.Vector3();
    velocity.copy(raycaster.ray.direction);
    velocity.multiplyScalar(30);

    createRigidBody(newBall, ballShape, ballMass, pos, quat, velocity);

    console.log("Bola lanzada!");
  });

  console.log("Controles de ratón inicializados");
}

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  updatePhysics(deltaTime);
  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);
}

function updatePhysics(deltaTime) {
  physicsWorld.stepSimulation(deltaTime, 10);

  for (let i = 0; i < rigidBodies.length; i++) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    const ms = objPhys.getMotionState();

    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();

      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

      // Detectar Bolos caídos
      if (objThree.userData.isPin && !objThree.userData.knocked) {
        // Si el bolo está inclinado más de 30 grados, está derribado
        const angle =
          Math.abs(objThree.rotation.x) + Math.abs(objThree.rotation.z);
        if (angle > 0.5) {
          animatePinKnockdown(objThree);
        }
      }

      // Detectar golpes a objetivos bonus
      if (objThree.userData.isBonus && !objThree.userData.bonusHit) {
        // Si el objetivo se mueve mucho en Y, fue golpeado
        if (Math.abs(objThree.position.y - 0.4) > 0.5) {
          animateBonusHit(objThree);
        }
      }
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
