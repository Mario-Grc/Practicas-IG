import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer;
let camera;
let info;
let grid;
let estrella,
  Planetas = [],
  Lunas = [];
let t0 = 0;
let accglobal = 0.001;
let timestamp;
let planetaSeleccionado = 3; // por defecto se selecciona la tierra
let vistaActual = "orbital"; // "orbital" o "nave"
let cameraOffset = { distance: 5, height: 3, angle: 0 }; // Para modo nave
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

const nombresPlanetas = [
  "Mercurio",
  "Venus",
  "Tierra",
  "Marte",
  "Júpiter",
  "Saturno",
  "Urano",
  "Neptuno",
];

init();
animationLoop();

function init() {
  info = document.createElement("div");
  info.style.position = "absolute";
  info.style.top = "30px";
  info.style.width = "100%";
  info.style.textAlign = "center";
  info.style.color = "#fff";
  info.style.fontWeight = "bold";
  info.style.backgroundColor = "transparent";
  info.style.zIndex = "1";
  info.style.fontFamily = "Monospace";
  info.innerHTML =
    "Sistema Solar de Mario García Abellán (2025-2026)<br>" +
    "[1-8] Seleccionar planeta | [0] Vista orbital<br>" +
    `Vista actual: ${
      vistaActual === "nave" ? nombresPlanetas[planetaSeleccionado] : "Orbital"
    }`;
  document.body.appendChild(info);

  // Control para cambiar vista
  document.addEventListener("keydown", (event) => {
    const key = event.key;

    if (key >= "1" && key <= String(Planetas.length)) {
      planetaSeleccionado = parseInt(key) - 1; // índice del planeta (0 = Mercurio)
      vistaActual = "nave";
    } else if (key === "0") {
      // volver a vista normal o mirar el Sol
      vistaActual = "orbital";
    }
  });

  //Defino cámara
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 50, 80);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  let camcontrols = new OrbitControls(camera, renderer.domElement);

  // Controles de ratón para modo nave
  renderer.domElement.addEventListener("mousedown", (e) => {
    if (vistaActual === "nave") {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  renderer.domElement.addEventListener("mousemove", (e) => {
    if (isDragging && vistaActual === "nave") {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      cameraOffset.angle -= deltaX * 0.01;
      cameraOffset.height = Math.max(
        0,
        Math.min(10, cameraOffset.height + deltaY * 0.05)
      );

      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  renderer.domElement.addEventListener("mouseup", () => {
    isDragging = false;
  });

  renderer.domElement.addEventListener("wheel", (e) => {
    if (vistaActual === "nave") {
      e.preventDefault();
      cameraOffset.distance = Math.max(
        3,
        Math.min(15, cameraOffset.distance + e.deltaY * 0.01)
      );
    }
  });

  // cargo las texturas
  const earth = new THREE.TextureLoader().load("src/textures/earthmap1k.jpg");
  const mercury = new THREE.TextureLoader().load("src/textures/mercurymap.jpg");
  const venus = new THREE.TextureLoader().load("src/textures/venusmap.jpg");
  const mars = new THREE.TextureLoader().load("src/textures/mars_1k_color.jpg");
  const jupiter = new THREE.TextureLoader().load("src/textures/jupitermap.jpg");
  const saturn = new THREE.TextureLoader().load("src/textures/saturnmap.jpg");
  const uranus = new THREE.TextureLoader().load("src/textures/uranusmap.jpg");
  const neptune = new THREE.TextureLoader().load("src/textures/neptunemap.jpg");
  const moon = new THREE.TextureLoader().load("src/textures/moon_1024.jpg");

  // iluminacion
  const sunLight = new THREE.PointLight(0xffffff, 2, 0);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  //luz ambiental para que no quede todo negro
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);

  // fondo con estrellas
  const estrellasFondo = new THREE.BufferGeometry();
  const estrellasVertices = [];

  //creo las estrellas
  for (let i = 0; i < 5000; i++) {
    // Distribución aleatoria en una esfera grande
    const radius = 300 + Math.random() * 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    estrellasVertices.push(x, y, z);
  }

  estrellasFondo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(estrellasVertices, 3)
  );

  const estrellasMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    sizeAttenuation: true,
  });

  const campoEstrellas = new THREE.Points(estrellasFondo, estrellasMaterial);
  scene.add(campoEstrellas);

  //Objetos
  Estrella(3, 0xffee88);
  Planeta(0.35, 8.0, 4.15, 0x888888, 1.0, 0.98, mercury); // Mercurio
  Planeta(0.85, 12.0, 1.62, 0xffe4b5, 1.0, 0.99, venus); // Venus
  Planeta(0.9, 16.0, 1.0, 0xffffff, 1.0, 0.98, earth); // Tierra
  Planeta(0.48, 22.0, 0.53, 0xaa3300, 1.0, 0.96, mars); // Marte
  Planeta(2.5, 36.0, 0.084, 0xc88b3a, 1.0, 0.95, jupiter); // Júpiter
  Planeta(2.1, 50.0, 0.034, 0xfad5a5, 1.0, 0.94, saturn); // Saturno
  Planeta(1.2, 65.0, 0.012, 0x4fd0e7, 1.0, 0.98, uranus); // Urano
  Planeta(1.15, 78.0, 0.006, 0x4166f5, 1.0, 0.99, neptune); // Neptuno

  Luna(Planetas[2], 0.24, 2.5, 1.5, 0xbbbbbb, Math.PI / 2, moon);

  // para ajustar cuando se cambie el tamaño de la ventana
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  //Inicio tiempo
  t0 = Date.now();
}

function Estrella(rad, col) {
  let geometry = new THREE.SphereGeometry(rad, 10, 10);
  let material = new THREE.MeshBasicMaterial({ color: col });
  estrella = new THREE.Mesh(geometry, material);
  scene.add(estrella);
}

function Planeta(radio, dist, vel, col, f1, f2, texture) {
  let geom = new THREE.SphereGeometry(radio, 10, 10);
  let mat = new THREE.MeshStandardMaterial({ color: col });

  if (texture != undefined) {
    mat.map = texture;
  }

  let planeta = new THREE.Mesh(geom, mat);

  planeta.userData.dist = dist;
  planeta.userData.speed = vel;
  planeta.userData.f1 = f1;
  planeta.userData.f2 = f2;

  Planetas.push(planeta);
  scene.add(planeta);

  //Dibuja trayectoria, con
  let curve = new THREE.EllipseCurve(
    0,
    0, // centro
    dist * f1,
    dist * f2 // radios elipse
  );
  //Crea geometría
  let points = curve.getPoints(50);
  // Convertir puntos 2D a 3D en el plano XZ
  let points3d = points.map((p) => new THREE.Vector3(p.x, 0, p.y));
  let geome = new THREE.BufferGeometry().setFromPoints(points3d);
  let mate = new THREE.LineBasicMaterial({ color: 0xffffff });
  // Objeto
  let orbita = new THREE.Line(geome, mate);
  scene.add(orbita);
}

function Luna(planeta, radio, dist, vel, col, angle, texture) {
  var pivote = new THREE.Object3D();
  pivote.rotation.x = angle;
  planeta.add(pivote);
  var geom = new THREE.SphereGeometry(radio, 10, 10);
  var mat = new THREE.MeshStandardMaterial({ color: col });

  if (texture != undefined) {
    mat.map = texture;
  }

  var luna = new THREE.Mesh(geom, mat);
  luna.userData.dist = dist;
  luna.userData.speed = vel;

  Lunas.push(luna);
  pivote.add(luna);
}

//Bucle de animación
function animationLoop() {
  timestamp = (Date.now() - t0) * accglobal;

  info.innerHTML =
    "Sistema Solar de Mario García Abellán (2025-2026)<br>" +
    "[1-8] Seleccionar planeta | [0] Vista orbital<br>" +
    `Vista actual: ${
      vistaActual === "nave" ? nombresPlanetas[planetaSeleccionado] : "Orbital"
    }`;

  requestAnimationFrame(animationLoop);

  //Modifica rotación de todos los objetos
  for (let object of Planetas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) *
      object.userData.f1 *
      object.userData.dist;
    object.position.z =
      Math.sin(timestamp * object.userData.speed) *
      object.userData.f2 *
      object.userData.dist;
    object.position.y = 0;
  }

  for (let object of Lunas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) * object.userData.dist;
    object.position.z =
      Math.sin(timestamp * object.userData.speed) * object.userData.dist;
    object.position.y = 0;
  }

  // Actualizar cámara según la vista
  if (vistaActual === "nave") {
    let planeta = Planetas[planetaSeleccionado];
    if (planeta) {
      let angle = Math.atan2(planeta.position.z, planeta.position.x);
      let totalAngle = angle + cameraOffset.angle;

      camera.position.set(
        planeta.position.x + cameraOffset.distance * Math.cos(totalAngle),
        planeta.position.y + cameraOffset.height,
        planeta.position.z + cameraOffset.distance * Math.sin(totalAngle)
      );
      camera.lookAt(planeta.position);
    }
  } else {
    // Vista orbital, la cámara se mantiene con OrbitControls
  }

  renderer.render(scene, camera);
}
