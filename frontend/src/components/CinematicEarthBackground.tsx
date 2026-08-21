import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CinematicEarthProps {
  speedFactor?: number;
}

export default function CinematicEarthBackground({ speedFactor = 1.0 }: CinematicEarthProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── 1. Scene, Camera & WebGL Renderer Setup ────────────────
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5.0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // ─── 2. Procedural High-Contrast Earth Textures ─────────────
    function generateEarthTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Texture();

      ctx.fillStyle = '#02050f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      oceanGrad.addColorStop(0, '#01030a');
      oceanGrad.addColorStop(0.35, '#051026');
      oceanGrad.addColorStop(0.5, '#0b1d3d');
      oceanGrad.addColorStop(0.7, '#061126');
      oceanGrad.addColorStop(1, '#010206');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawLand = (x: number, y: number, rx: number, ry: number, col?: string) => {
        ctx.fillStyle = col || '#15241b';
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      };

      drawLand(480, 320, 240, 150, '#1c2d22');
      drawLand(520, 280, 180, 110, '#28382b');
      drawLand(640, 680, 150, 240, '#17261c');
      drawLand(1280, 300, 380, 200, '#1e3023');
      drawLand(1450, 380, 260, 150, '#263428');
      drawLand(1100, 560, 200, 240, '#2c2b1e');
      drawLand(1680, 720, 140, 110, '#302b1f');

      ctx.fillStyle = 'rgba(215, 235, 255, 0.45)';
      drawLand(500, 200, 300, 70);
      drawLand(1300, 200, 400, 70);

      ctx.strokeStyle = 'rgba(0, 219, 233, 0.25)';
      ctx.lineWidth = 12;
      ctx.stroke();

      return new THREE.CanvasTexture(canvas);
    }

    function generateCloudTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Texture();

      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 280; i++) {
        const cx = Math.random() * canvas.width;
        const cy = Math.random() * canvas.height;
        const cr = Math.random() * 170 + 40;
        const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, cr);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.35, 'rgba(235, 245, 255, 0.55)');
        grad.addColorStop(0.7, 'rgba(210, 235, 255, 0.15)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    }

    // ─── 3. Starry Cosmos ───────────────────────────────────────
    const starCount = 2800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 60 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = radius * Math.cos(phi);

      const bright = Math.random();
      starColors[i3] = bright > 0.4 ? 0.9 : 0.4;
      starColors[i3 + 1] = bright > 0.4 ? 0.95 : 0.6;
      starColors[i3 + 2] = 1.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ─── 4. Main Earth Sphere (Positioned to match reference) ───
    const earthRadius = 5.8;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 128, 128);

    const earthCustomShader = {
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D cloudMap;
        uniform vec3 lightPosition;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          vec3 viewDir = normalize(-vPosition);
          vec3 lightDir = normalize(lightPosition - vPosition);
          
          float nDotL = dot(vNormal, lightDir);
          float diff = smoothstep(-0.1, 0.7, nDotL);

          vec4 texColor = texture2D(map, vUv);
          vec4 cloudColor = texture2D(cloudMap, vUv);

          vec3 surfaceColor = mix(texColor.rgb, vec3(0.9, 0.95, 1.0), cloudColor.r * 0.88);

          float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
          rim = pow(rim, 4.0);
          vec3 rimColor = mix(vec3(0.0, 0.55, 1.0), vec3(0.85, 0.98, 1.0), rim);

          vec3 illuminated = (surfaceColor * diff * 0.9) + (rimColor * rim * 2.2 * (diff + 0.2));

          float depthFade = smoothstep(-1.8, 0.6, vPosition.y);
          illuminated *= depthFade;

          gl_FragColor = vec4(illuminated, 1.0);
        }
      `,
    };

    const earthTexture = generateEarthTexture();
    const cloudTexture = generateCloudTexture();

    const earthMat = new THREE.ShaderMaterial({
      vertexShader: earthCustomShader.vertexShader,
      fragmentShader: earthCustomShader.fragmentShader,
      uniforms: {
        map: { value: earthTexture },
        cloudMap: { value: cloudTexture },
        lightPosition: { value: new THREE.Vector3(0, 4.5, -3.0) },
      },
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(0, -6.05, 0);
    scene.add(earthMesh);

    // ─── 5. Radiant Atmospheric Halo & Horizon Bloom ────────────
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 glowColor;
      uniform float coefficient;
      uniform float power;
      void main() {
        vec3 viewDirection = normalize(-vPosition);
        float intensity = pow(coefficient + dot(vNormal, viewDirection), power);
        intensity = clamp(intensity, 0.0, 1.0);
        
        vec3 finalGlow = mix(glowColor, vec3(0.95, 0.98, 1.0), pow(intensity, 3.5));
        float horizonClip = smoothstep(-1.5, 0.5, vPosition.y);
        gl_FragColor = vec4(finalGlow, intensity * 0.98 * horizonClip);
      }
    `;

    const atmosphereGeo = new THREE.SphereGeometry(earthRadius + 0.16, 128, 128);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        glowColor: { value: new THREE.Color(0x0077ff) },
        coefficient: { value: 0.10 },
        power: { value: 4.2 },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    earthMesh.add(atmosphereMesh);

    // ─── 6. Orbiting Satellites with Telemetry Scans ─────────────
    const satellites: Array<{ root: THREE.Group; speed: number }> = [];
    const satGroup = new THREE.Group();
    earthMesh.add(satGroup);

    function createSatellite(orbitRadius: number, inclination: number, speed: number, colorHex: number) {
      const satRoot = new THREE.Group();
      satRoot.rotation.x = inclination;

      const bodyGeo = new THREE.BoxGeometry(0.06, 0.03, 0.04);
      const bodyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const body = new THREE.Mesh(bodyGeo, bodyMat);

      const panelGeo = new THREE.PlaneGeometry(0.12, 0.04);
      const panelMat = new THREE.MeshBasicMaterial({ color: 0x00dbe9, side: THREE.DoubleSide });
      const leftPanel = new THREE.Mesh(panelGeo, panelMat);
      leftPanel.position.x = -0.09;
      const rightPanel = new THREE.Mesh(panelGeo, panelMat);
      rightPanel.position.x = 0.09;
      body.add(leftPanel);
      body.add(rightPanel);

      const beamGeo = new THREE.CylinderGeometry(0.002, 0.04, 0.6, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = -0.3;
      body.add(beam);

      body.position.set(orbitRadius, 0, 0);
      satRoot.add(body);
      satGroup.add(satRoot);

      satellites.push({ root: satRoot, speed });
    }

    createSatellite(earthRadius + 0.55, Math.PI / 4, 0.004, 0x00eefc);
    createSatellite(earthRadius + 0.85, -Math.PI / 6, 0.003, 0x7df4ff);
    createSatellite(earthRadius + 0.70, Math.PI / 3, 0.005, 0x38bdf8);

    // ─── 7. Interactivity & Parallax ────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let scrollY = window.scrollY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // ─── 8. Render Animation Loop ───────────────────────────────
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      camera.position.x = mouseX * 0.3;
      camera.position.y = 0.0 + mouseY * 0.18 - scrollY * 0.0006;
      camera.lookAt(0, -0.3, 0);

      const baseSpeed = 0.0006 * speedFactor;
      earthMesh.rotation.y += baseSpeed;

      satellites.forEach((sat) => {
        sat.root.rotation.y += sat.speed * speedFactor;
      });

      starField.rotation.y += 0.00005;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [speedFactor]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen z-0 pointer-events-none overflow-hidden bg-black"
    />
  );
}
