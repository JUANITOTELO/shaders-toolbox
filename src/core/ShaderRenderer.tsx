import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface ShaderRendererProps {
  fragmentShader: string;
  uniforms?: Record<string, number | number[]>;
  onError?: (error: { message: string; line?: number } | null) => void;
  className?: string;
}

export const ShaderRenderer: React.FC<ShaderRendererProps> = ({
  fragmentShader,
  uniforms = {},
  onError,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const elapsedTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const mouseRef = useRef<{ x: number; y: number; clickX: number; clickY: number }>({
    x: 0.5,
    y: 0.5,
    clickX: 0,
    clickY: 0
  });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    mouseRef.current.x = x;
    mouseRef.current.y = y;
    if (e.buttons === 1) {
      mouseRef.current.clickX = x;
      mouseRef.current.clickY = y;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) {
      if (onError) onError({ message: 'WebGL2 is not supported on this device/browser.' });
      return;
    }

    const vsSource = `#version 300 es
      in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fullFS = `#version 300 es
      precision highp float;
      out vec4 fragColor;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec4 u_mouse;
      
      ${fragmentShader}

      void main() {
        mainImage(fragColor, gl_FragCoord.xy);
      }
    `;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader) || 'Shader compilation failed';
        gl.deleteShader(shader);
        const match = info.match(/ERROR: \d+:(\d+):/);
        const line = match ? parseInt(match[1], 10) - 8 : undefined;
        throw { message: info, line };
      }
      return shader;
    };

    let program: WebGLProgram;
    try {
      const vertShader = createShader(gl.VERTEX_SHADER, vsSource);
      const fragShaderObj = createShader(gl.FRAGMENT_SHADER, fullFS);
      program = gl.createProgram()!;
      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShaderObj);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw { message: gl.getProgramInfoLog(program) || 'Program link error' };
      }
      if (onError) onError(null);
    } catch (err: any) {
      if (onError) onError(err);
      return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosLoc = gl.getAttribLocation(program, 'a_position');
    const uResLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');

    let frameCount = 0;
    let fpsTimer = performance.now();

    const render = () => {
      if (!canvas) return;
      const now = performance.now();
      const dt = (now - lastTimeRef.current) / 1000.0;
      lastTimeRef.current = now;

      if (!isPaused) {
        elapsedTimeRef.current += dt;
      }

      frameCount++;
      if (now - fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - fpsTimer)));
        frameCount = 0;
        fpsTimer = now;
      }

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(aPosLoc);
      gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, elapsedTimeRef.current);
      gl.uniform4f(
        uMouseLoc,
        mouseRef.current.x * canvas.width,
        mouseRef.current.y * canvas.height,
        mouseRef.current.clickX * canvas.width,
        mouseRef.current.clickY * canvas.height
      );

      Object.entries(uniforms).forEach(([name, val]) => {
        const loc = gl.getUniformLocation(program, name);
        if (loc) {
          if (typeof val === 'number') gl.uniform1f(loc, val);
          else if (Array.isArray(val) && val.length === 2) gl.uniform2f(loc, val[0], val[1]);
          else if (Array.isArray(val) && val.length === 3) gl.uniform3f(loc, val[0], val[1], val[2]);
        }
      });

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      gl.deleteProgram(program);
    };
  }, [fragmentShader, uniforms, isPaused, onError]);

  return (
    <div className={`relative w-full h-full group select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        className="w-full h-full block cursor-crosshair"
      />
      {/* Viewport Floating HUD */}
      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-neutral-900/80 backdrop-blur border border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          FPS: <strong className="text-emerald-400">{fps}</strong>
        </span>
        <span className="text-neutral-700">|</span>
        <span>Time: <strong className="text-neutral-200">{elapsedTimeRef.current.toFixed(1)}s</strong></span>
      </div>

      {/* Play / Pause / Reset Floating Controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-900/80 backdrop-blur border border-neutral-800">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          title={isPaused ? 'Play' : 'Pause'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => { elapsedTimeRef.current = 0; }}
          className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Reset Time"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
