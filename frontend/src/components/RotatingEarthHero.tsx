import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { playCinematicZoomSound, playSatelliteBeep } from '../lib/soundFx';
import { Volume2, VolumeX, RotateCcw, Satellite, ShieldCheck, Sparkles, ArrowRight, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RotatingEarthHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isZooming, setIsZooming] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [satelliteSpeed, setSatelliteSpeed] = useState(1.0);

  // Trigger cinematic zoom and sound
  const triggerZoomSequence = useCallback(() => {
    setIsZooming(true);
    if (soundEnabled) {
      playCinematicZoomSound();
    }
    const timer = setTimeout(() => {
      setIsZooming(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [soundEnabled]);

  // Initial mount trigger
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      if (!audioPlayed) {
        if (soundEnabled) playCinematicZoomSound();
        setAudioPlayed(true);
      }
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true });
    window.addEventListener('keydown', handleFirstUserInteraction, { once: true });

    const timeout = setTimeout(() => {
      setIsZooming(false);
    }, 2200);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('keydown', handleFirstUserInteraction);
    };
  }, [soundEnabled, audioPlayed]);

  // 3D Canvas Earth & Orbiting Satellite Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;
    let cloudRotation = 0;
    const rotationSpeed = 0.003;

    // Satellites orbital parameters (3D orbital planes)
    let satAngle1 = 0; // Sentinel-2 (Polar Sun-Synchronous)
    let satAngle2 = Math.PI * 0.8; // PlanetScope Flock (Inclined)
    let satAngle3 = Math.PI * 1.5; // Landsat-9 (Equatorial Drift)

    // Starry cosmos
    const stars: Array<{ x: number; y: number; size: number; alpha: number; twinkleSpeed: number }> = [];
    for (let i = 0; i < 240; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
      });
    }

    // Simplified polygon continents for 3D sphere projection [lon, lat]
    const continents: Array<Array<[number, number]>> = [
      // North America
      [[-160, 70], [-130, 60], [-120, 50], [-115, 30], [-90, 20], [-80, 25], [-75, 40], [-60, 50], [-70, 65], [-120, 75]],
      // South America
      [[-80, 10], [-75, -10], [-70, -30], [-65, -55], [-55, -40], [-35, -5], [-50, 5], [-75, 12]],
      // Eurasia
      [[-10, 35], [0, 45], [20, 60], [60, 65], [100, 70], [140, 65], [160, 55], [130, 35], [100, 20], [75, 10], [50, 25], [35, 35], [10, 38]],
      // Africa
      [[-15, 30], [10, 37], [30, 30], [45, 10], [40, -10], [30, -30], [20, -35], [10, -10], [-10, 5], [-15, 20]],
      // Australia
      [[115, -20], [130, -12], [145, -15], [150, -30], [140, -38], [120, -35], [115, -25]],
      // India & SE Asia
      [[68, 25], [75, 30], [88, 25], [82, 10], [75, 8], [72, 18]],
      // Europe
      [[0, 45], [15, 55], [30, 50], [25, 40], [10, 40]],
    ];

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth * dpr : window.innerWidth * dpr;
      canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight * dpr : 600 * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Draw realistic 3D satellite spacecraft model
    const drawSatelliteSpacecraft = (
      sx: number,
      sy: number,
      scale: number,
      label: string,
      color: string,
      scanAngle: number,
      z: number,
      earthRadius: number
    ) => {
      ctx.save();
      ctx.translate(sx, sy);

      // Downward Multi-Spectral Scanning Laser Cone (when in front of Earth)
      if (z > 0.1) {
        ctx.save();
        const laserGrad = ctx.createLinearGradient(0, 0, 0, earthRadius * 0.7);
        laserGrad.addColorStop(0, `${color}99`);
        laserGrad.addColorStop(0.3, `${color}44`);
        laserGrad.addColorStop(1, `${color}00`);

        ctx.fillStyle = laserGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-45 * scale, earthRadius * 0.65);
        ctx.lineTo(45 * scale, earthRadius * 0.65);
        ctx.closePath();
        ctx.fill();

        // Scanning raster beam grid on ground
        ctx.strokeStyle = `${color}aa`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, earthRadius * 0.62, 45 * scale, 12 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Spacecraft rotation aligned with orbital flight vector
      ctx.rotate(scanAngle);
      ctx.scale(scale, scale);

      // 1. Dual Solar Panel Wings (Metallic photovoltaic cells with gold trim)
      // Left Wing
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-38, -6, 26, 12);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.strokeRect(-38, -6, 26, 12);
      // Solar cell grid lines
      ctx.strokeStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(-25, -6); ctx.lineTo(-25, 6);
      ctx.moveTo(-38, 0); ctx.lineTo(-12, 0);
      ctx.stroke();

      // Right Wing
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(12, -6, 26, 12);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.strokeRect(12, -6, 26, 12);
      ctx.strokeStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(25, -6); ctx.lineTo(25, 6);
      ctx.moveTo(12, 0); ctx.lineTo(38, 0);
      ctx.stroke();

      // Wing support struts
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
      ctx.stroke();

      // 2. Central Spacecraft Bus (Gold Multi-Layer Insulation Foil)
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-8, -8, 16, 16);

      // High-resolution optical lens / SAR payload aperture
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();

      // Ion Thruster Plasma Glow
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, -9, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      // Spacecraft Label Tag
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = 'bold 10px monospace';
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillText(`🛰️ ${label}`, sx + 14 * scale, sy - 8 * scale);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
      ctx.font = '8px monospace';
      ctx.fillText(`${z > 0 ? 'GROUND TRACK ACTIVE' : 'FAR SIDE PASS'}`, sx + 14 * scale, sy + 4 * scale);
      ctx.restore();
    };

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Cosmic Background
      const spaceGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 50, width * 0.5, height * 0.5, Math.max(width, height));
      spaceGrad.addColorStop(0, '#040814');
      spaceGrad.addColorStop(0.5, '#02040a');
      spaceGrad.addColorStop(1, '#000103');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // Blue Nebula Gas Glow
      const nebulaGrad = ctx.createRadialGradient(width * 0.5, height * 0.75, 10, width * 0.5, height * 0.75, width * 0.6);
      nebulaGrad.addColorStop(0, 'rgba(14, 116, 144, 0.22)');
      nebulaGrad.addColorStop(0.4, 'rgba(3, 105, 161, 0.12)');
      nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // Twinkling Stars
      stars.forEach((star) => {
        star.alpha += Math.sin(Date.now() * star.twinkleSpeed) * 0.01;
        const currentAlpha = Math.max(0.1, Math.min(1.0, star.alpha));
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Earth Positioning & Dimensions
      const centerX = width * 0.5;
      const isMobile = width < 768;
      const radius = isMobile ? width * 0.65 : Math.min(width * 0.42, height * 0.85);
      const centerY = height * 0.88;

      // Update Satellite Orbital Angles
      satAngle1 += 0.014 * satelliteSpeed;
      satAngle2 += 0.010 * satelliteSpeed;
      satAngle3 += 0.007 * satelliteSpeed;

      // 3D Orbital Calculation for Satellite 1 (Sentinel-2 Polar Orbit)
      const orbit1Radius = radius * 1.32;
      const inclination1 = Math.PI * 0.38; // Tilted polar inclination
      const s1X_rel = Math.cos(satAngle1) * orbit1Radius;
      const s1Y_rel = Math.sin(satAngle1) * orbit1Radius * Math.sin(inclination1);
      const s1Z = Math.sin(satAngle1) * orbit1Radius * Math.cos(inclination1);
      const s1X = centerX + s1X_rel;
      const s1Y = centerY + s1Y_rel;

      // 3D Orbital Calculation for Satellite 2 (PlanetScope 3m Flock)
      const orbit2Radius = radius * 1.48;
      const inclination2 = -Math.PI * 0.28;
      const s2X_rel = Math.cos(satAngle2) * orbit2Radius;
      const s2Y_rel = Math.sin(satAngle2) * orbit2Radius * Math.sin(inclination2);
      const s2Z = Math.sin(satAngle2) * orbit2Radius * Math.cos(inclination2);
      const s2X = centerX + s2X_rel;
      const s2Y = centerY + s2Y_rel;

      // 3D Orbital Trajectory Lines (Rear segments drawn first)
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.2;

      // Orbit 1 Ring
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, orbit1Radius, orbit1Radius * Math.sin(inclination1), Math.PI / 12, 0, Math.PI * 2);
      ctx.stroke();

      // Orbit 2 Ring
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.15)';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, orbit2Radius, orbit2Radius * Math.sin(Math.abs(inclination2)), -Math.PI / 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ----------------------------------------------------
      // DRAW SATELLITES BEHIND EARTH (Z < 0)
      // ----------------------------------------------------
      if (s1Z <= 0) {
        const s1Scale = 0.65 + (s1Z / orbit1Radius) * 0.2;
        drawSatelliteSpacecraft(s1X, s1Y, s1Scale, 'SENTINEL-2A (MSI)', '#38bdf8', satAngle1, s1Z, radius);
      }
      if (s2Z <= 0) {
        const s2Scale = 0.6 + (s2Z / orbit2Radius) * 0.2;
        drawSatelliteSpacecraft(s2X, s2Y, s2Scale, 'PLANETSCOPE 3m', '#4ade80', satAngle2, s2Z, radius);
      }

      // ----------------------------------------------------
      // DRAW EARTH SPHERE & ATMOSPHERIC CORONA
      // ----------------------------------------------------
      // Outer Atmospheric Luminous Blue Corona
      const coronaGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.95, centerX, centerY, radius * 1.35);
      coronaGrad.addColorStop(0, 'rgba(56, 189, 248, 0.75)');
      coronaGrad.addColorStop(0.15, 'rgba(14, 165, 233, 0.45)');
      coronaGrad.addColorStop(0.4, 'rgba(3, 105, 161, 0.18)');
      coronaGrad.addColorStop(0.7, 'rgba(2, 56, 110, 0.05)');
      coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Earth Sphere Clipping Path
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Deep Ocean Radial Base
      const oceanGrad = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.4,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      oceanGrad.addColorStop(0, '#1e3a8a');
      oceanGrad.addColorStop(0.4, '#0f265c');
      oceanGrad.addColorStop(0.8, '#061330');
      oceanGrad.addColorStop(1, '#020713');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

      // Render Rotating Continents with 3D Orthographic Projection
      rotation += rotationSpeed;
      cloudRotation += rotationSpeed * 1.25;

      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
      ctx.shadowBlur = 4;

      continents.forEach((poly) => {
        const projectedPoints: Array<[number, number] | null> = poly.map(([lon, lat]) => {
          const lambda = ((lon + rotation * (180 / Math.PI)) * Math.PI) / 180;
          const phi = (lat * Math.PI) / 180;

          const cosPhi = Math.cos(phi);
          const x = radius * cosPhi * Math.sin(lambda);
          const y = -radius * Math.sin(phi);
          const z = radius * cosPhi * Math.cos(lambda);

          if (z > 0) {
            return [centerX + x, centerY + y];
          }
          return null;
        });

        const validPoints = projectedPoints.filter((p): p is [number, number] => p !== null);
        if (validPoints.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(validPoints[0][0], validPoints[0][1]);
          for (let i = 1; i < validPoints.length; i++) {
            ctx.lineTo(validPoints[i][0], validPoints[i][1]);
          }
          ctx.closePath();

          const landGrad = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
          landGrad.addColorStop(0, '#4ade80');
          landGrad.addColorStop(0.5, '#16a34a');
          landGrad.addColorStop(1, '#14532d');
          ctx.fillStyle = landGrad;
          ctx.fill();

          ctx.strokeStyle = 'rgba(134, 239, 172, 0.6)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;

      // Cloud Layer Overlays with Parallax Rotation
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      for (let c = 0; c < 6; c++) {
        const cLon = (c * 60 + cloudRotation * (180 / Math.PI)) % 360 - 180;
        const cLat = (c % 2 === 0 ? 30 : -20) + Math.sin(c + cloudRotation) * 10;
        const lambda = (cLon * Math.PI) / 180;
        const phi = (cLat * Math.PI) / 180;

        const cosPhi = Math.cos(phi);
        const cx = radius * cosPhi * Math.sin(lambda);
        const cy = -radius * Math.sin(phi);
        const cz = radius * cosPhi * Math.cos(lambda);

        if (cz > 0) {
          ctx.beginPath();
          ctx.ellipse(centerX + cx, centerY + cy, radius * 0.28, radius * 0.12, Math.PI / 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Day/Night Twilight Terminator Shadow
      const terminatorGrad = ctx.createLinearGradient(
        centerX - radius * 0.8,
        centerY - radius * 0.8,
        centerX + radius * 0.8,
        centerY + radius * 0.8
      );
      terminatorGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      terminatorGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.15)');
      terminatorGrad.addColorStop(0.7, 'rgba(2, 6, 23, 0.75)');
      terminatorGrad.addColorStop(1, 'rgba(0, 2, 8, 0.96)');
      ctx.fillStyle = terminatorGrad;
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

      // Luminous Blue Horizon Edge Reflection
      const edgeGlow = ctx.createRadialGradient(centerX, centerY, radius * 0.92, centerX, centerY, radius);
      edgeGlow.addColorStop(0, 'rgba(56, 189, 248, 0)');
      edgeGlow.addColorStop(0.7, 'rgba(56, 189, 248, 0.45)');
      edgeGlow.addColorStop(0.95, 'rgba(186, 230, 253, 0.85)');
      edgeGlow.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      ctx.fillStyle = edgeGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // Restore Earth clip

      // ----------------------------------------------------
      // DRAW SATELLITES IN FRONT OF EARTH (Z > 0)
      // ----------------------------------------------------
      if (s1Z > 0) {
        const s1Scale = 0.85 + (s1Z / orbit1Radius) * 0.35;
        drawSatelliteSpacecraft(s1X, s1Y, s1Scale, 'SENTINEL-2A (MSI)', '#38bdf8', satAngle1, s1Z, radius);
      }
      if (s2Z > 0) {
        const s2Scale = 0.8 + (s2Z / orbit2Radius) * 0.35;
        drawSatelliteSpacecraft(s2X, s2Y, s2Scale, 'PLANETSCOPE 3m', '#4ade80', satAngle2, s2Z, radius);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [satelliteSpeed]);

  return (
    <div className="relative w-full h-[88vh] min-h-[580px] max-h-[900px] overflow-hidden bg-black flex flex-col items-center justify-between select-none">
      {/* 3D Canvas Background (Rotating Earth & Revolving Satellites) */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-auto"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{
          scale: isZooming ? [0.4, 1.05, 1.0] : 1.0,
          opacity: 1,
        }}
        transition={{
          duration: 2.2,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
      </motion.div>

      {/* Top Floating Controls (Sound, Satellite Speed & Replay Intro) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-900/80 border border-dark-700/80 text-[11px] font-mono text-emerald-400 backdrop-blur shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE ORBITAL SATELLITE TELEMETRY
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Satellite Orbit Speed Toggle */}
          <button
            onClick={() => setSatelliteSpeed((prev) => (prev === 1.0 ? 2.0 : prev === 2.0 ? 0.5 : 1.0))}
            className="p-2 rounded-xl bg-dark-900/90 hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-white backdrop-blur text-xs font-mono flex items-center gap-1.5 transition-all shadow-lg"
            title="Adjust satellite revolving speed"
          >
            <Radio className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Orbit {satelliteSpeed}x</span>
          </button>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playSatelliteBeep();
            }}
            className={`p-2 rounded-xl border backdrop-blur text-xs font-mono flex items-center gap-1.5 transition-all shadow-lg ${
              soundEnabled
                ? 'bg-dark-900/90 text-primary-400 border-primary-500/40 hover:bg-dark-800'
                : 'bg-dark-900/60 text-slate-500 border-dark-700 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Sound FX Enabled' : 'Sound FX Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-primary-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Audio ON' : 'Muted'}</span>
          </button>

          <button
            onClick={triggerZoomSequence}
            className="p-2 rounded-xl bg-dark-900/90 hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-white backdrop-blur text-xs font-mono flex items-center gap-1.5 transition-all shadow-lg"
            title="Replay Space-Zoom Opening Sequence"
          >
            <RotateCcw className={`w-4 h-4 ${isZooming ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Replay Zoom</span>
          </button>
        </div>
      </div>

      {/* Center Cinematic Hero Typography (Matching user's reference) */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.6 }}
        className="relative z-20 text-center max-w-4xl px-4 my-auto flex flex-col items-center"
      >
        {/* Subtitle pill badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-950/70 border border-primary-500/40 text-xs sm:text-sm font-medium text-primary-300 backdrop-blur mb-6 shadow-[0_0_25px_rgba(34,197,94,0.25)]"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Next-Gen Autonomous Parametric Agriculture Insurance</span>
        </motion.div>

        {/* Large Bold Cinematic Title matching ARGIPROF.AI reference */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-widest uppercase mb-4 drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]">
          AGRIPROOF<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-emerald-300 to-cyan-400">.AI</span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-lg md:text-xl max-w-2xl font-normal leading-relaxed mb-8 drop-shadow">
          Autonomous multi-spectral crop damage verification powered by rotating Sentinel-2 & PlanetScope orbital satellite AI and Groth16 Zero-Knowledge cryptography.
        </p>

        {/* Sleek CTA Button matching the reference 'get started' placement */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/register"
            onClick={() => playSatelliteBeep()}
            className="group relative inline-flex items-center justify-center px-9 py-4 text-base sm:text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 via-emerald-600 to-teal-600 hover:from-primary-500 hover:to-teal-500 transition-all shadow-[0_0_30px_rgba(34,197,94,0.45)] hover:shadow-[0_0_45px_rgba(34,197,94,0.7)] hover:scale-105"
          >
            <span className="tracking-wide uppercase font-black text-sm sm:text-base">Get Started</span>
            <ArrowRight className="ml-2.5 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </Link>

          <Link
            to="/farms"
            className="inline-flex items-center justify-center px-7 py-3.5 text-sm sm:text-base font-semibold rounded-2xl text-slate-200 bg-dark-900/90 border border-dark-700 hover:border-slate-500 hover:bg-dark-800 transition-all backdrop-blur shadow-lg"
          >
            Explore Registered Farms
          </Link>
        </div>
      </motion.div>

      {/* Bottom Orbital Provenance Feature Bar */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { label: 'Revolving Satellites', val: 'Sentinel-2 + PlanetScope', icon: <Satellite className="w-4 h-4 text-sky-400" /> },
            { label: 'Privacy Protocol', val: 'Groth16 Zero-Knowledge', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
            { label: 'Scanning Swath', val: '290km Multi-Spectral BOA', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
            { label: 'Claim Payout', val: 'Automated Parametric', icon: <ArrowRight className="w-4 h-4 text-purple-400" /> },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-dark-950/70 border border-dark-800/80 backdrop-blur-md py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 text-xs font-mono shadow-md"
            >
              {item.icon}
              <div className="text-left">
                <span className="text-slate-500 block text-[10px] uppercase">{item.label}</span>
                <span className="text-slate-200 font-bold block truncate">{item.val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
