# Semana 11 - Animación y físicas

Un juego de bolos interactivo en 3D desarrollado con Three.js y física realista usando Ammo.js. Este proyecto ha sido desarrollado en [CodeSandbox](https://codesandbox.io/p/sandbox/entrega-s10-ig2526-cxn26t).

## Video de demostración

[Video](JuegoBolosDemo.mp4)

## Descripción

Juego de bolos en 3D con física realista donde puedes lanzar una bola, derribar bolos y alcanzar objetivos bonus. Incluye sistema de potencia de lanzamiento, animaciones fluidas y efectos visuales al conseguir un strike.

Los bolos reaccionan a la colisión según las simulaciones de Ammo.js y el objetivo principal es derribarlos todos para conseguir un STRIKE, que activa efectos especiales de cámara, color y animaciones.

Además, se incluyen objetivos bonus flotantes y rotatorios que otorgan efectos visuales especiales al ser golpeados.

### Mecánicas principales

- **Lanzamiento de potencia variable**: Mantén pulsado ESPACIO para cargar potencia, la barra de potencia cambiará de color (verde → amarillo → rojo). Suelta ESPACIO para lanzar con la fuerza acumulada.
- **Sistema de físicas realistas**: La bola reacciona a la gravedad, a las colisiones y se elimina si se queda parada. Los bolos detectan la inclinación para saber si han sido derribados.
- **Animación del strike**: Si se derriban todos los bolos aparece un texto gigante de "STRIKE", la cámara vibra y hace algunos movimientos.

## Controles e interacción

| Tecla | Acción |
|-------|--------|
| **ESPACIO (mantener)** | Cargar potencia de lanzamiento |
| **ESPACIO (soltar)** | Lanzar la bola |
| **R** | Reiniciar el juego |
| **Click + Arrastrar** | Rotar cámara (apuntar) |
| **Scroll** | Zoom de cámara |

## Referencias
- [Documentación three.js](https://threejs.org/manual/#en/creating-a-scene)
- [Ejemplos con ammo para inspiración](https://threejs.org/examples/?q=ammo)
- Uso de IA:
    - Preguntas puntuales
    - Animación del Strike
    - Crear la barra de potencia
    - Resolver algunos problemas que han ido surgiendo