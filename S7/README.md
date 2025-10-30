# Semana 7 - Sistema solar
Simulación 3D interactiva de nuestro sistema solar simplificado, creada con **three.js**. Este proyecto se realizó en [CodeSandbox](https://codesandbox.io/p/sandbox/ig2526-s7-entrega-jm3klw).

Enlace al [vídeo de demostración](https://youtu.be/tnRteZtXArU).

## Descripción
Este proyecto renderiza una escena 3D que representa una estrella central (Sol) y varios planetas orbitando a su alrededor (incluyendo Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano y Neptuno). También incluye la Luna orbitando la Tierra. Para crear el fondo estrellado, se ha generado un campo con miles de puntos distribuidos esféricamente alrededor del sistema solar para dar la sensación de estrellas lejanas.

La simulación utiliza iluminación (**PointLight** en el Sol y **AmbientLight** global) y texturas para dar realismo a los cuerpos celestes. Además, dibuja las trayectorias elípticas de las órbitas, aunque no se termina de apreciar ya que tienen una excentricidad muy baja.

**Nota importante:** Las escalas de los planetas, sus distancias al Sol y las velocidades de órbita no son realistas. Han sido ajustadas artísticamente para una mejor visualización y composición de la escena.

## Controles
En la parte superior de la simulación hay un panel que indica los controles básicos y la vista actual. Los controles son los siguientes:
- "0": Cambia a la **vista general**. Este es el modo por defecto, donde se puede observar el sistema completo.
- "1" a "8" activa la **vista de planeta**. Esta vista fija la cámara en un planeta específico, permitiendo orbitar alrededor de este como si se estuviera en una nave. La selección sigue el orden de planetas de más cercano a más lejano:
  - "1": Mercurio
  - "2": Venus
  - "3": Tierra
  - "4": Marte
  - "5": Júpiter
  - "6": Saturno
  - "7": Urano
  - "8": Neptuno
- Click izquierdo + Arrastrar: Rotar cámara
- Rueda del ratón: Acercar o alejar cámara.

## Referencias
- [Texturas](https://planetpixelemporium.com/earth.html)
- [Documentación three.js](https://threejs.org/manual/#en/creating-a-scene)
- Uso de IA:
    - Para elegir el tamaño, órbita y velocidad de los planetas.
    - Ayuda para crear las estrellas de fondo.