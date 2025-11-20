#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
void main(){
    vec2 st=gl_FragCoord.xy/u_resolution;
    float w=sin(st.x*8.0+u_time*2.0)*0.03*st.x;
    vec2 uv=vec2(st.x,st.y+w);
    vec3 c=uv.y<.25?vec3(1,0,0):uv.y<.75?vec3(1,1,0):vec3(1,0,0);
    c*=1.0-w*8.0;
    float s=max(1.0-length(st-vec2(.3,.5)),0.0);
    c*=.7+s*.3;
    gl_FragColor=vec4(c,1);
}
