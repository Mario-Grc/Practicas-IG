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

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.z = 3;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camcontrols = new OrbitControls(camera, renderer.domElement);
  camcontrols.enableRotate = false;

  window.addEventListener("mousemove", onMouseMove);

  // CARGA TEXTURA (MAPA)
  const tx1 = new THREE.TextureLoader().load(
    "src/data/mapa2.png",
    function (texture) {
      const txaspectRatio = texture.image.width / texture.image.height;
      mapsy = scale;
      mapsx = mapsy * txaspectRatio;
      Plano(0, 0, 0, mapsx, mapsy);

      mapa.material.map = texture;
      mapa.material.needsUpdate = true;

      ajustarCamaraAlMapa();

      console.log("Mapa cargado, dimensiones:", mapsx, mapsy);

      // CARGA DE DATOS
      fetch("src/data/municipios.csv")
        .then((response) => {
          if (!response.ok) throw new Error("Error: " + response.statusText);
          return response.text();
        })
        .then((content) => {
          procesarCSVMunicipios(content);
          console.log("Municipios procesados:", datosMunicipios.length);
          return fetch("src/data/indicadores_demograficos_municipios.csv");
        })
        .then((response) => response.text())
        .then((content) => {
          const datosEstadisticos = procesarCSVPoblacion(content);
          console.log("Estadísticas procesadas:", datosEstadisticos.length);
          combinarDatos(datosMunicipios, datosEstadisticos);
        })
        .catch((error) => {
          console.error("Error al cargar archivos:", error);
        });
    }
  );
}

// Procesamiento datos csv de municipios
function procesarCSVMunicipios(content) {
  const sep = ",";
  const filas = content.split("\n");
  const encabezados = filas[0].split(sep).map((h) => h.trim());

  const indices = {
    geocode: encabezados.indexOf("geocode"),
    etiqueta: encabezados.indexOf("etiqueta"),
    lat: encabezados.indexOf("lati_capi"),
    lon: encabezados.indexOf("long_capi"),
  };
  console.log("Indices de las columnas municipios:", indices);

  // Extrae los datos de interés
  for (let i = 1; i < filas.length; i++) {
    const columna = filas[i].split(sep);
    if (columna.length > 1 && columna[indices.lat] && columna[indices.lon]) {
      // IMPORTANTE: Limpiar comillas extras y espacios
      const geocode = columna[indices.geocode]
        ? columna[indices.geocode].trim().replace(/^"*|"*$/g, "")
        : "";
      const nombre = columna[indices.etiqueta]
        ? columna[indices.etiqueta].trim().replace(/^"*|"*$/g, "")
        : "";
      const lat = parseFloat(columna[indices.lat]);
      const lon = parseFloat(columna[indices.lon]);

      // Si no hay valores salto al siguiente
      if (isNaN(lat) || isNaN(lon) || !geocode) continue;

      datosMunicipios.push({ geocode, nombre, lat, lon });
    }
  }
  console.log(
    "Archivo csv municipios cargado:",
    datosMunicipios.length,
    "municipios"
  );
}

// Procesamiento datos csv de población
function procesarCSVPoblacion(content) {
  const sep = ",";
  const filas = content.split("\n");
  const encabezados = filas[0].split(sep).map((h) => h.trim());

  const indices = {
    date: encabezados.indexOf("date"),
    geocode: encabezados.indexOf("geocode"),
    poblacion: encabezados.indexOf("poblacion"),
    edad_media: encabezados.indexOf("poblacion_edad_media"),
    densidad: encabezados.indexOf("poblacion_ds"),
  };

  console.log("Indices población:", indices);

  const fecha = "2022-01-01";

  const datosFiltrados = [];
  for (let i = 1; i < filas.length; i++) {
    const columna = filas[i].split(sep);

    // Filtrar por fecha
    if (columna[indices.date] !== fecha) continue;
    if (columna.length <= 1) continue;

    // IMPORTANTE: Limpiar comillas extras
    const geocode = columna[indices.geocode]
      ? columna[indices.geocode].trim().replace(/^"*|"*$/g, "")
      : "";
    const poblacion = parseFloat(columna[indices.poblacion]);
    const edadMedia = parseFloat(columna[indices.edad_media]);
    const densidad = parseFloat(columna[indices.densidad]);

    if (!geocode || isNaN(poblacion)) continue;

    datosFiltrados.push({
      geocode,
      poblacion,
      edadMedia,
      densidad,
    });
  }

  console.log("Datos estadísticos filtrados:", datosFiltrados.length);
  return datosFiltrados;
}

// Combinar ambos datasets
function combinarDatos(municipios, datosPoblacion) {
  // DEPURACIÓN: Ver los geocodes
  console.log("=== DEPURACIÓN GEOCODES ===");
  console.log(
    "Primeros 5 geocodes MUNICIPIOS:",
    municipios.slice(0, 5).map((m) => `"${m.geocode}"`)
  );
  console.log(
    "Primeros 5 geocodes POBLACIÓN:",
    datosPoblacion.slice(0, 5).map((d) => `"${d.geocode}"`)
  );
  console.log("Total municipios:", municipios.length);
  console.log("Total población:", datosPoblacion.length);

  let combinados = 0;
  municipios.forEach((municipio) => {
    const stats = datosPoblacion.find((d) => d.geocode === municipio.geocode);

    if (stats) {
      municipio.poblacion = stats.poblacion;
      municipio.edadMedia = stats.edadMedia;
      municipio.densidad = stats.densidad;
      combinados++;
    } else {
      // IMPORTANTE: Asignar valores por defecto si no hay match
      municipio.poblacion = 5000;
      municipio.edadMedia = 42;
      municipio.densidad = 100;
    }
  });

  console.log(
    "Datos combinados correctamente:",
    combinados,
    "de",
    municipios.length
  );

  // Llamar a visualización después de combinar
  visualizarEsferas();
}

// Encontrar rangos para normalización
function encontrarRangos(datosMunicipios) {
  let poblacionMin = Infinity,
    poblacionMax = -Infinity;
  let edadMin = Infinity,
    edadMax = -Infinity;

  datosMunicipios.forEach((m) => {
    if (m.poblacion !== undefined && !isNaN(m.poblacion)) {
      poblacionMin = Math.min(poblacionMin, m.poblacion);
      poblacionMax = Math.max(poblacionMax, m.poblacion);
    }
    if (m.edadMedia !== undefined && !isNaN(m.edadMedia)) {
      edadMin = Math.min(edadMin, m.edadMedia);
      edadMax = Math.max(edadMax, m.edadMedia);
    }
  });

  // Si no hay datos válidos, usar valores por defecto
  if (poblacionMin === Infinity) poblacionMin = 1000;
  if (poblacionMax === -Infinity) poblacionMax = 100000;
  if (edadMin === Infinity) edadMin = 30;
  if (edadMax === -Infinity) edadMax = 50;

  console.log("Rangos - Población:", poblacionMin, "-", poblacionMax);
  console.log("Rangos - Edad media:", edadMin, "-", edadMax);

  return { poblacionMin, poblacionMax, edadMin, edadMax };
}

// Visualizar esferas con datos demográficos
function visualizarEsferas() {
  console.log("Iniciando visualización de esferas...");

  // Limpia las esferas anteriores si existen
  for (let i = objetos.length - 1; i >= 0; i--) {
    scene.remove(objetos[i]);
    objetos[i].geometry.dispose();
    objetos[i].material.dispose();
  }
  objetos.length = 0;

  const rangos = encontrarRangos(datosMunicipios);

  let esferasCreadas = 0;
  datosMunicipios.forEach((m) => {
    // Si no tiene datos de población, usar valores por defecto
    if (m.poblacion === undefined) {
      m.poblacion = rangos.poblacionMin;
      m.edadMedia = rangos.edadMin;
    }

    // Radio proporcional a población (0.05 a 0.15 - más grandes para que se vean)
    let radio = Map2Range(
      m.poblacion,
      rangos.poblacionMin,
      rangos.poblacionMax,
      0.05,
      0.15
    );

    // Color según edad media (Azul para jóvenes -> Rojo para mayores)
    let t = (m.edadMedia - rangos.edadMin) / (rangos.edadMax - rangos.edadMin);
    let r = Math.floor(255 * t);
    let g = 0;
    let b = Math.floor(255 * (1 - t));
    let color = (r << 16) | (g << 8) | b;

    // Mapear coordenadas geográficas a coordenadas del mapa
    let mlon = Map2Range(m.lon, minlon, maxlon, -mapsx / 2, mapsx / 2);
    let mlat = Map2Range(m.lat, minlat, maxlat, -mapsy / 2, mapsy / 2);

    // Crear esfera
    Esfera(mlon, mlat, 0.01, radio, 16, 16, color, m);
    esferasCreadas++;
  });

  console.log("Esferas creadas y añadidas a la escena:", esferasCreadas);
}

// Dados los límites del mapa de latitud y longitud, mapea posiciones en ese rango
function Map2Range(val, vmin, vmax, dmin, dmax) {
  let t = 1 - (vmax - val) / (vmax - vmin);
  return dmin + t * (dmax - dmin);
}

// Crear esfera
function Esfera(px, py, pz, radio, nx, ny, col, userData) {
  let geometry = new THREE.SphereBufferGeometry(radio, nx, ny);
  let material = new THREE.MeshBasicMaterial({
    color: col,
  });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);

  // Guardar datos del municipio en userData para uso posterior (ej: clicks)
  if (userData) {
    mesh.userData = userData;
  }

  objetos.push(mesh);
  scene.add(mesh);
}

// Crear plano para el mapa
function Plano(px, py, pz, sx, sy) {
  let geometry = new THREE.PlaneGeometry(sx, sy);
  let material = new THREE.MeshBasicMaterial({});
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  mapa = mesh;
}

// Bucle de animación
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objetos);

  const info = document.getElementById("infoMunicipio");

  if (intersects.length > 0) {
    const m = intersects[0].object.userData;

    info.style.display = "block";
    info.style.left = event.clientX + 15 + "px";
    info.style.top = event.clientY + 15 + "px";

    info.innerHTML = `
      <strong>${m.nombre}</strong><br>
      Población: ${m.poblacion.toLocaleString()}<br>
      Edad media: ${m.edadMedia}<br>
      Densidad: ${m.densidad} (Población / km²)
    `;
  } else {
    info.style.display = "none";
  }
}

// Filtro de población
document.getElementById("btnAplicarFiltro").addEventListener("click", () => {
  const min = parseInt(document.getElementById("poblacionMin").value);
  const max = parseInt(document.getElementById("poblacionMax").value);

  objetos.forEach((obj) => {
    const poblacion = obj.userData.poblacion;

    // Mostrar/ocultar según filtro
    if (poblacion >= min && poblacion <= max) {
      obj.visible = true;
    } else {
      obj.visible = false;
    }
  });
});

document.getElementById("btnReiniciarFiltro").addEventListener("click", () => {
  // Restaurar valores por defecto
  document.getElementById("poblacionMin").value = 0;
  document.getElementById("poblacionMax").value = 500000;

  // Hacer visibles todas las esferas
  objetos.forEach((obj) => {
    obj.visible = true;
  });
});

document
  .getElementById("btnReiniciarMapa")
  .addEventListener("click", () => ajustarCamaraAlMapa());

function ajustarCamaraAlMapa() {
  const fovRad = (camera.fov * Math.PI) / 180;
  const distancia = mapsy / (2 * Math.tan(fovRad / 2));

  camera.position.set(0, 0, distancia + 0.01); // un pelín más lejos para no cortar
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  if (camcontrols) {
    camcontrols.target.set(0, 0, 0);
    camcontrols.update();
  }
}
