import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Ammo from "ammojs-typed";
import TWEEN from "@tweenjs/tween.js";

// Variables globales
let camera, scene, renderer, controls;
let physicsWorld;
let clock;
let ball = null;
let pins = [];
let bonusTargets = [];
let pinsKnockedDown = 0;

// Variables para física
const rigidBodies = [];
let transformAux1;
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const margin = 0.05;

// Variables para el sistema de lanzamiento
let ballLaunched = false;
let chargingPower = false;
let currentPower = 0;
const minPower = 5;
const maxPower = 50;
const chargeSpeed = 30; // Unidades de potencia por segundo
let ballSpawnPosition = new THREE.Vector3(0, 0.5, 8);

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

// Crear el título con mi nombre
const title = document.createElement("div");
title.id = "game-title";
title.innerText = "Mario García Abellán";
title.style.position = "fixed";
title.style.top = "10px";
title.style.left = "50%";
title.style.transform = "translateX(-50%)";
title.style.fontSize = "16px";
title.style.fontFamily = "Arial, sans-serif";
title.style.color = "#ffffff";
title.style.textShadow = "0px 0px 10px black";
title.style.zIndex = "10";
document.body.appendChild(title);

// Texto de STRIKE oculto
const strikeText = document.createElement("div");
strikeText.id = "strike-text";
strikeText.innerText = "¡STRIKE!";
strikeText.style.position = "fixed";
strikeText.style.top = "40%";
strikeText.style.left = "50%";
strikeText.style.transform = "translate(-50%, -50%) scale(0)";
strikeText.style.fontSize = "90px";
strikeText.style.fontFamily = "Impact, Arial Black, sans-serif";
strikeText.style.color = "#FFD700";
strikeText.style.textShadow = "0 0 20px black";
strikeText.style.transition = "transform 0.6s ease-out, opacity 1s";
strikeText.style.opacity = "0";
strikeText.style.zIndex = "20";
document.body.appendChild(strikeText);

// Barra de potencia
const powerBarContainer = document.createElement("div");
powerBarContainer.id = "power-bar-container";
powerBarContainer.style.position = "fixed";
powerBarContainer.style.bottom = "50px";
powerBarContainer.style.left = "50%";
powerBarContainer.style.transform = "translateX(-50%)";
powerBarContainer.style.width = "300px";
powerBarContainer.style.height = "30px";
powerBarContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
powerBarContainer.style.border = "2px solid white";
powerBarContainer.style.borderRadius = "5px";
powerBarContainer.style.display = "none";
powerBarContainer.style.zIndex = "10";
document.body.appendChild(powerBarContainer);

const powerBarFill = document.createElement("div");
powerBarFill.id = "power-bar-fill";
powerBarFill.style.width = "0%";
powerBarFill.style.height = "100%";
powerBarFill.style.backgroundColor = "#00ff00";
powerBarFill.style.borderRadius = "3px";
powerBarFill.style.transition = "background-color 0.1s";
powerBarContainer.appendChild(powerBarFill);

const powerBarText = document.createElement("div");
powerBarText.id = "power-bar-text";
powerBarText.innerText = "Mantén ESPACIO para cargar potencia";
powerBarText.style.position = "fixed";
powerBarText.style.bottom = "90px";
powerBarText.style.left = "50%";
powerBarText.style.transform = "translateX(-50%)";
powerBarText.style.fontSize = "14px";
powerBarText.style.fontFamily = "Arial, sans-serif";
powerBarText.style.color = "#ffffff";
powerBarText.style.textShadow = "0px 0px 5px black";
powerBarText.style.display = "none";
powerBarText.style.zIndex = "10";
document.body.appendChild(powerBarText);

function initGraphics() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 12);
  camera.lookAt(ballSpawnPosition);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);

  controls.target.copy(ballSpawnPosition);
  controls.enablePan = false;
  controls.enableDamping = true;

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

function createRigidBody(object, physicsShape, mass, pos, quat) {
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
  createBonusTargets();
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

function animateBonusTarget(target, index) {
  const startY = target.position.y;
  const delay = index * 500;

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

function animatePinKnockdown(pin) {
  if (pin.userData.knocked) return;

  pin.userData.knocked = true;
  pinsKnockedDown++;

  // Cambio de color del bolo
  new TWEEN.Tween(pin.material.color)
    .to({ r: 1, g: 0, b: 0 }, 300)
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

  console.log(`Bolo derribado! Total: ${pinsKnockedDown}/${pins.length}`);

  // STRIKE - Cuando se derriban todos los bolos
  if (pinsKnockedDown === pins.length) {
    celebrateStrike();
  }
}

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

function celebrateStrike() {
  console.log("¡¡¡STRIKE!!!");

  // Mostrar STRIKE en pantalla
  const strikeText = document.getElementById("strike-text");
  strikeText.style.transform = "translate(-50%, -50%) scale(1)";
  strikeText.style.opacity = "1";

  setTimeout(() => {
    strikeText.style.transform = "translate(-50%, -50%) scale(0)";
    strikeText.style.opacity = "0";
  }, 2000);

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

  pos.copy(ballSpawnPosition);

  ball = createSphereWithPhysics(
    ballRadius,
    ballMass,
    pos,
    new THREE.MeshPhongMaterial({ color: 0x2020ff })
  );

  console.log(" Bola creada");
}

function launchBall(power) {
  if (!ball || ballLaunched) return;

  ballLaunched = true;

  // Obtener dirección de la cámara
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  // Normalizar y aplicar potencia
  direction.normalize();
  direction.multiplyScalar(power);

  // Aplicar velocidad
  ball.userData.physicsBody.setLinearVelocity(
    new Ammo.btVector3(direction.x, direction.y, direction.z)
  );

  // Activar el cuerpo rígido
  ball.userData.physicsBody.activate();

  console.log(`Bola lanzada con potencia ${power.toFixed(1)}`);
}

function resetGame() {
  console.log("Reiniciando el juego...");

  // Reset variables de estado
  ballLaunched = false;
  chargingPower = false;
  currentPower = 0;
  pinsKnockedDown = 0;
  document.getElementById("power-bar-container").style.display = "none";
  document.getElementById("power-bar-text").style.display = "none";

  // Eliminar todos los objetos dinámicos (bolos, bonus, bola)
  for (let i = rigidBodies.length - 1; i >= 0; i--) {
    const obj = rigidBodies[i];
    physicsWorld.removeRigidBody(obj.userData.physicsBody);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    scene.remove(obj);
  }

  // Limpiar arrays
  rigidBodies.length = 0;
  pins.length = 0;
  bonusTargets.length = 0;
  ball = null;

  // Resetear visual
  scene.background.setHex(0x87ceeb);

  // Resetear cámara
  camera.position.set(0, 10, 12);
  controls.target.copy(ballSpawnPosition);
  controls.update();

  // Recrear todo
  createPins();
  createBonusTargets();
  createBall();

  console.log("¡Juego reiniciado!");
}

function initInput() {
  // Detectar cuando se presiona ESPACIO
  window.addEventListener("keydown", function (event) {
    // Reiniciar con R
    if (event.key === "r" || event.key === "R") {
      resetGame();
      return;
    }

    // Lanzar con ESPACIO
    if (event.code === "Space" && !ballLaunched && ball) {
      if (!chargingPower) {
        chargingPower = true;
        currentPower = minPower;

        // Mostrar barra de potencia
        document.getElementById("power-bar-container").style.display = "block";
        document.getElementById("power-bar-text").style.display = "block";
      }
    }
  });

  // Detectar cuando se suelta ESPACIO
  window.addEventListener("keyup", function (event) {
    if (event.code === "Space" && chargingPower) {
      chargingPower = false;

      // Ocultar barra de potencia
      document.getElementById("power-bar-container").style.display = "none";
      document.getElementById("power-bar-text").style.display = "none";

      // Lanzar la bola
      launchBall(currentPower);

      currentPower = 0;
    }
  });

  console.log("Controles de teclado inicializados");
}

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  updatePhysics(deltaTime);
  TWEEN.update();
  updatePowerBar(deltaTime);
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

      if (objThree === ball && ballLaunched) {
        const velocity = objPhys.getLinearVelocity();
        const speed = Math.sqrt(
          velocity.x() * velocity.x() +
            velocity.y() * velocity.y() +
            velocity.z() * velocity.z()
        );

        if (speed < 0.1 || objThree.position.y < -2) {
          respawnBall();
        }
      }
    }
  }
}

function respawnBall() {
  if (!ball) return;

  console.log("Reapareciendo bola...");

  ballLaunched = false;

  const index = rigidBodies.indexOf(ball);
  if (index > -1) {
    rigidBodies.splice(index, 1);
  }

  physicsWorld.removeRigidBody(ball.userData.physicsBody);

  // Liberar memoria
  if (ball.geometry) ball.geometry.dispose();
  if (ball.material) ball.material.dispose();

  scene.remove(ball);

  createBall();

  ball.scale.set(0.1, 0.1, 0.1);
  new TWEEN.Tween(ball.scale)
    .to({ x: 1, y: 1, z: 1 }, 300)
    .easing(TWEEN.Easing.Back.Out)
    .start();
}

function updatePowerBar(deltaTime) {
  if (chargingPower) {
    // Incrementar potencia
    currentPower += chargeSpeed * deltaTime;

    // Limitar al máximo
    if (currentPower > maxPower) {
      currentPower = maxPower;
    }

    // Actualizar barra visual
    const percentage =
      ((currentPower - minPower) / (maxPower - minPower)) * 100;
    const powerBarFill = document.getElementById("power-bar-fill");
    powerBarFill.style.width = percentage + "%";

    // Cambiar color según potencia
    if (percentage < 33) {
      powerBarFill.style.backgroundColor = "#00ff00"; // Verde
    } else if (percentage < 66) {
      powerBarFill.style.backgroundColor = "#ffff00"; // Amarillo
    } else {
      powerBarFill.style.backgroundColor = "#ff0000"; // Rojo
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
