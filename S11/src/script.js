import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Ammo from "ammojs-typed";

// Variables globales
let camera, scene, renderer, controls;
let physicsWorld;
let clock;
let tank = null;

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

  // Configurar gráficos (Three.js)
  initGraphics();

  // Configurar física (Ammo.js)
  initPhysics();

  // Crear objetos
  createObjects();

  // Iniciar animación
  animate();
}

function initGraphics() {
  // Escena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // Cámara
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(10, 5, 10);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Controles
  controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true;
  controls.target.set(0, 2, 0);
  controls.update();

  // Reloj
  clock = new THREE.Clock();

  // Luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Responsive
  window.addEventListener("resize", onWindowResize);

  console.log("Gráficos inicializados");
}

function initPhysics() {
  // Configuración de colisiones
  const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  const broadphase = new Ammo.btDbvtBroadphase();
  const solver = new Ammo.btSequentialImpulseConstraintSolver();

  // Crear mundo físico
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );

  // Gravedad
  physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));

  // Variable auxiliar para transformaciones
  transformAux1 = new Ammo.btTransform();

  console.log("Física inicializada");
}

function createBoxWithPhysics(sx, sy, sz, mass, pos, quat, material) {
  // PARTE VISUAL (Three.js)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.copy(pos);
  mesh.quaternion.copy(quat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // PARTE FÍSICA (Ammo.js)
  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );
  shape.setMargin(margin);

  createRigidBody(mesh, shape, mass, pos, quat);

  return mesh;
}

function createRigidBody(object, physicsShape, mass, pos, quat) {
  // Transformación inicial
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

  const motionState = new Ammo.btDefaultMotionState(transform);

  // Inercia
  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);

  // Crear cuerpo rígido
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    physicsShape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);
  body.setFriction(0.5);

  // Conectar física con visual
  object.userData.physicsBody = body;

  scene.add(object);

  // Si tiene masa (no es estático)
  if (mass > 0) {
    rigidBodies.push(object);
    body.setActivationState(4); // No desactivar
  }

  physicsWorld.addRigidBody(body);

  return body;
}

function createObjects() {
  // Crear suelo
  pos.set(0, -0.5, 0);
  quat.set(0, 0, 0, 1);

  const suelo = createBoxWithPhysics(
    100,
    1,
    100,
    0,
    pos,
    quat,
    new THREE.MeshPhongMaterial({ color: 0x3a8c3f })
  );

  console.log("Suelo creado");

  // Cargar tanque
  loadTank();
}

// --- CARGAR EL TANQUE ---
function loadTank() {
  const loader = new GLTFLoader();
  loader.load(
    "/modelos/leopard_2A4M.glb",
    (gltf) => {
      tank = gltf.scene;

      // Calcular el tamaño del tanque
      const box = new THREE.Box3().setFromObject(tank);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      console.log("Tamaño del tanque:", size);
      console.log("Centro del tanque:", center);

      // Ahora creamos la física
      addPhysicsToTank(tank, size, center);

      scene.add(tank);
      console.log("Tanque cargado");
    },
    undefined,
    (error) => console.error("Error cargando tanque:", error)
  );
}

function addPhysicsToTank(tankMesh, size, center) {
  // Posición inicial (elevado para que caiga)
  const startPos = new THREE.Vector3(0, 5, 0);
  tankMesh.position.copy(startPos);

  // Calculamos donde debería estar la base de la caja
  const halfHeight = size.y * 0.5; // Mitad de la altura de la caja

  const physicsPos = new THREE.Vector3(
    startPos.x + center.x,
    startPos.y - center.y + halfHeight, // Bajamos al origen y subimos media caja
    startPos.z + center.z
  );

  console.log("Tamaño caja:", size);
  console.log("Centro modelo:", center);
  console.log("Posición física ajustada:", physicsPos);

  // Caja de colisión ajustada al tamaño real
  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(size.x * 0.47, size.y * 0.47, size.z * 0.47)
  );
  shape.setMargin(margin);

  // Transformación inicial con posición ajustada
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(
    new Ammo.btVector3(physicsPos.x, physicsPos.y, physicsPos.z)
  );
  transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

  const motionState = new Ammo.btDefaultMotionState(transform);

  // Masa del tanque
  const mass = 50;
  const localInertia = new Ammo.btVector3(0, 0, 0);
  shape.calculateLocalInertia(mass, localInertia);

  // Crear cuerpo rígido
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    shape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);

  // Propiedades físicas
  body.setFriction(1.0);
  body.setDamping(0.3, 0.3);

  // Guardar el offset ajustado para sincronizar correctamente
  tankMesh.userData.physicsBody = body;
  tankMesh.userData.centerOffset = new THREE.Vector3(
    center.x,
    -center.y + halfHeight,
    center.z
  );
  rigidBodies.push(tankMesh);
  body.setActivationState(4);

  physicsWorld.addRigidBody(body);

  console.log("Física del tanque añadida");
}

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  // Actualizar física
  updatePhysics(deltaTime);

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

      // Si tiene offset del centro (como el tanque), compensarlo
      if (objThree.userData.centerOffset) {
        const offset = objThree.userData.centerOffset;
        objThree.position.set(
          p.x() - offset.x,
          p.y() - offset.y, // Aquí se compensa el ajuste que hicimos
          p.z() - offset.z
        );
      } else {
        // Objetos normales sin offset (como el suelo)
        objThree.position.set(p.x(), p.y(), p.z());
      }

      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
