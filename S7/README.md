# Semana 7 - Sistema Solar
Simulación 3D interactiva de un sistema solar básico, creada con **three.js**. Este proyecto se realizó en [CodeSandbox](https://codesandbox.io/p/sandbox/ig2526-s7-entrega-jm3klw).

## Descripción
Este proyecto renderiza una escena 3D que representa una estrella central (Sol) y varios planetas orbitando a su alrededor (incluyendo Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano y Neptuno). También incluye una luna orbitando la Tierra.

La simulación utiliza texturas para dar realismo a los cuerpos celestes y dibuja las trayectorias elípticas de las órbitas.

## Controles
En la parte superior de la simulación hay un panel que indica los controles básicos y la vista actual. Los controles son los siguientes:
- "0": Cambia a la vista general.
- "1" a "8" activa la vista de un planeta:
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
    - Para elegir el tamaño, órbita y color de los planetas.
    - Ayuda para crear las estrellas de fondo.