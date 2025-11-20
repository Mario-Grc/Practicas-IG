#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    vec2 uv = st * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    float r = length(uv);

    float radius = 0.3;
    float blur = 0.02;

    float waves = sin(10.0 * r - u_time * 3.0) * 0.03; // turbulencias

    float core = smoothstep(radius + blur + waves,radius - blur + waves,r);

    // halo exterior
    float glow = smoothstep(1.0, 0.3, r);

    vec3 col_outer = vec3(0.05, 0.0, 0.0);
    vec3 col_glow  = vec3(1.0, 0.4, 0.1);
    vec3 col_core  = vec3(1.0, 0.8, 0.2);

    vec3 color = mix(col_outer, col_glow, glow);
    color = mix(color, col_core, core);

    color += 0.1 * sin(u_time + uv.x * 5.0) * vec3(1.0, 0.5, 0.2);

    gl_FragColor = vec4(color, 1.0);
}
