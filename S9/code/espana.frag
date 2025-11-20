// Autor: Mario

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    // Onda base
    float amplitude = 0.03;
    float frequency = 8.0;
    float speed = 2.0;
    float wave = sin(st.x * frequency + u_time * speed) * amplitude;
    wave *= st.x;

    vec2 uv = st;
    uv.y += wave;

    vec3 color;
    if (uv.y < 0.25) {
        color = vec3(1.0, 0.0, 0.0);	// rojo
    } else if (uv.y < 0.75) {
        color = vec3(1.0, 1.0, 0.0);	// amarillo
    } else {
        color = vec3(1.0, 0.0, 0.0);	// rojo
    }

    // Sombreado basado en la deformación
    float shade = wave * 8.0;

    color *= 1.0 - shade;

    // luz
    float spot = 1.0 - length(st - vec2(0.3, 0.5));
    spot = max(spot, 0.0);
    color *= 0.7 + spot * 0.3;

    gl_FragColor = vec4(color, 1.0);
}
