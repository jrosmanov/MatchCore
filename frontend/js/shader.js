/**
 * MatchCore — shader.js
 * WebGL animated particle background for the home page.
 */
(function () {
  const canvas = document.getElementById('shader-canvas');
  if (!canvas) return;

  function syncSize() {
    canvas.width  = canvas.clientWidth  || 1280;
    canvas.height = canvas.clientHeight || 720;
  }
  new ResizeObserver(syncSize).observe(canvas);
  syncSize();

  const gl = canvas.getContext('webgl');
  if (!gl) return;

  const VS = `
    attribute vec2 a;
    varying vec2 v;
    void main() { v = a * .5 + .5; gl_Position = vec4(a, 0, 1); }
  `;

  const FS = `
    precision highp float;
    uniform float t;
    uniform vec2 r;

    float h(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy * 2.0 - r) / min(r.y, r.x);
      vec3 col = vec3(0.039, 0.055, 0.102);

      for (float i = 0.0; i < 40.0; i++) {
        vec2 pos = vec2(h(vec2(i, 1.0)) * 2.0 - 1.0, h(vec2(i, 2.0)) * 2.0 - 1.0);
        pos.x += sin(t * .2 + i) * .2;
        pos.y += cos(t * .3 + i) * .2;
        float d  = length(uv - pos);
        float sz = .005 + h(vec2(i, 3.0)) * .01;
        float sp = smoothstep(sz, .0, d);
        col += vec3(0.0, 0.83, 1.0) * sp * (.5 + .5 * sin(t + i));
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function createShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, createShader(gl.VERTEX_SHADER,   VS));
  gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Shader link error:', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uT = gl.getUniformLocation(prog, 't');
  const uR = gl.getUniformLocation(prog, 'r');

  function render(ts) {
    syncSize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(uT, ts * .001);
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
