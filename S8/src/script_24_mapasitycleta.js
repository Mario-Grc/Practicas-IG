import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer, camera, camcontrols;
let mapa,
  mapsx,
  mapsy,
  scale = 5;

// Latitud y longitud de los extremos del mapa de la imagen
let minlon = -18.435,
  maxlon = -13.052;
let minlat = 26.944,
  maxlat = 29.99;

let objetos = [];
const datosMunicipios = [];

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  //Posición de la cámara
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camcontrols = new OrbitControls(camera, renderer.domElement);

  //CARGA TEXTURA (MAPA)
  //Crea plano, ajustando su tamaño al de la textura, manteniendo relación de aspecto
  const tx1 = new THREE.TextureLoader().load(
    "src/data/mapa2.png",

    // Acciones a realizar tras la carga
    function (texture) {
      //Objeto sobre el que se mapea la textura del mapa
      //Plano para mapa manteniendo proporciones de la textura de entrada
      const txaspectRatio = texture.image.width / texture.image.height;
      mapsy = scale;
      mapsx = mapsy * txaspectRatio;
      Plano(0, 0, 0, mapsx, mapsy);

      //Dimensiones, textura
      //console.log(texture.image.width, texture.image.height);
      mapa.material.map = texture;
      mapa.material.needsUpdate = true;

      //CARGA DE DATOS
      fetch("src/data/municipios.csv")
        .then((response) => {
          if (!response.ok) throw new Error("Error: " + response.statusText);
          return response.text();
        })
        .then((content) => {
          procesarCSVMunicipios(content);
        })
        .catch((error) => {
          console.error("Error al cargar el archivo:", error);
        });
    },
  );
}

//Procesamiento datos csv
function procesarCSVMunicipios(content) {
  const sep = ","; // separador ;
  const filas = content.split("\n");

  // Primera fila es el encabezado, separador ;
  const encabezados = filas[0].split(sep).map((h) => h.trim());
  // Obtiene índices de columnas de interés
  const indices = {
    etiqueta: encabezados.indexOf("etiqueta"),
    lat: encabezados.indexOf("lati_capi"),
    lon: encabezados.indexOf("long_capi"),
  };
  console.log("Indices de las columnas", indices);

  // Extrae los datos de interés de las estaciones
  for (let i = 1; i < filas.length; i++) {
    const columna = filas[i].split(sep); // separador ;
    if (columna.length > 1 && columna[indices.lat] && columna[indices.lon]) {
      const nombre = columna[indices.etiqueta].trim();
      const lat = parseFloat(columna[indices.lat]);
      const lon = parseFloat(columna[indices.lon]);

      // si no hay valores salto al siguiente
      if (isNaN(lat) || isNaN(lon)) continue;

      datosMunicipios.push({ nombre, lat, lon });

      //Mapea lon y lat a las dimensiones del mapa
      //longitudes crecen hacia la derecha, como la x
      let mlon = Map2Range(
        columna[indices.lon],
        minlon,
        maxlon,
        -mapsx / 2,
        mapsx / 2,
      );
      //Latitudes crecen hacia arriba, como la y
      let mlat = Map2Range(
        columna[indices.lat],
        minlat,
        maxlat,
        -mapsy / 2,
        mapsy / 2,
      );
      //Crea esfera en localización mapeada a coordenadas del mapa
      Esfera(mlon, mlat, 0, 0.01, 10, 10, 0xff9800);
    }
  }
  console.log("Archivo csv municipios cargado");
}

//Dados los límites del mapa del latitud y longitud, mapea posiciones en ese rango
//valor, rango origen, rango destino
function Map2Range(val, vmin, vmax, dmin, dmax) {
  //Normaliza valor en el rango de partida, t=0 en vmin, t=1 en vmax
  let t = 1 - (vmax - val) / (vmax - vmin);
  return dmin + t * (dmax - dmin);
}

function Esfera(px, py, pz, radio, nx, ny, col) {
  let geometry = new THREE.SphereBufferGeometry(radio, nx, ny);
  let material = new THREE.MeshBasicMaterial({
    color: col,
  });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  objetos.push(mesh);
  scene.add(mesh);
}

function Plano(px, py, pz, sx, sy) {
  let geometry = new THREE.PlaneGeometry(sx, sy);
  let material = new THREE.MeshBasicMaterial({});
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  mapa = mesh;
}

//Bucle de animación
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
