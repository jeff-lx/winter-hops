import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Player, Bell, Particle } from '../types';
import { GRAVITY, JUMP_FORCE, BELL_SPAWN_RATE, COLORS } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setMultiplier: (mult: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore, setMultiplier }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs (Mutable for performance in loop)
  const playerRef = useRef<Player>({
    id: 'player', x: 0, y: 0, width: 30, height: 30, vx: 0, vy: 0, state: 'idle', rotation: 0
  });
  const bellsRef = useRef<Bell[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraYRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const multiplierRef = useRef<number>(1);
  const mouseXRef = useRef<number>(window.innerWidth / 2);
  const worldHeightRef = useRef<number>(0); // Total height climbed
  const lastBellYRef = useRef<number>(0); // Track where we spawned the last bell
  const prevGameState = useRef<GameState>(gameState);
  const isGroundedRef = useRef<boolean>(true);

  // Helper to generate UUID-ish strings
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const spawnBell = useCallback((canvasWidth: number, y: number, currentWorldHeight: number) => {
    const margin = 50;
    
    // Dynamic Difficulty: Size decreases as you go higher
    // Base size 35, scales down to 15 over 10000 height units
    const progress = Math.min(Math.max(currentWorldHeight, 0) / 15000, 1);
    const size = 40 - (progress * 25); // Starts at 40, ends at 15
    
    // Probability of bird increases slightly with height
    const isBird = Math.random() < (0.02 + progress * 0.05); 
    
    // Birds move fast sideways
    const vx = isBird 
        ? (Math.random() < 0.5 ? 2.5 : -2.5) 
        : (Math.random() - 0.5) * 0.5;

    bellsRef.current.push({
      id: generateId(),
      x: margin + Math.random() * (canvasWidth - margin * 2),
      y: y,
      width: isBird ? 30 : size,
      height: isBird ? 20 : size,
      vx: vx, 
      vy: 0,
      type: isBird ? 'bird' : 'normal',
      active: true,
      scale: 1,
    });
  }, []);

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure canvas is sized correctly before spawning entities
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Reset Player to Ground
    playerRef.current = {
      id: 'player',
      x: canvas.width / 2,
      y: canvas.height - 65,
      width: 30,
      height: 30,
      vx: 0,
      vy: 0,
      state: 'idle',
      rotation: 0
    };
    isGroundedRef.current = true;

    // Reset World
    bellsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    multiplierRef.current = 1;
    cameraYRef.current = 0;
    worldHeightRef.current = 0;
    
    // Spawn initial bells
    // Create a dense starting cluster to ensure playability
    let spawnY = canvas.height - 150;
    
    // Create a very dense ladder at the start
    for (let i = 0; i < 8; i++) { 
        spawnBell(canvas.width, spawnY, 0);
        spawnY -= 60; 
    }

    lastBellYRef.current = spawnY;
    
    // Fill the rest of the screen
    while (lastBellYRef.current > -100) {
      spawnBell(canvas.width, lastBellYRef.current, 0);
      lastBellYRef.current -= BELL_SPAWN_RATE;
    }
    
    setScore(0);
    setMultiplier(1);
  }, [setScore, setMultiplier, spawnBell]);

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        id: generateId(),
        x,
        y,
        width: 2,
        height: 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: color,
        size: Math.random() * 3 + 1
      });
    }
  };

  // Input Handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      mouseXRef.current = e.touches[0].clientX;
    };

    const attemptJump = () => {
       const player = playerRef.current;
       // Allow jump if in menu (starts game) OR if playing and on ground
       if (gameState === GameState.MENU) {
          setGameState(GameState.PLAYING);
          player.vy = JUMP_FORCE;
          isGroundedRef.current = false;
          spawnParticles(player.x, player.y + 15, '#fff', 8);
       } else if (gameState === GameState.PLAYING && isGroundedRef.current) {
          player.vy = JUMP_FORCE;
          isGroundedRef.current = false;
          spawnParticles(player.x, player.y + 15, '#fff', 8);
       }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mousedown', attemptJump);
    window.addEventListener('touchstart', attemptJump);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousedown', attemptJump);
      window.removeEventListener('touchstart', attemptJump);
    };
  }, [gameState, setGameState]);

  // Initial Mount
  useEffect(() => {
    initGame();
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            if (gameState === GameState.MENU) {
                initGame();
            }
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initGame, gameState]);

  // Handle State Transitions
  useEffect(() => {
    if (gameState === GameState.MENU && prevGameState.current === GameState.GAME_OVER) {
      initGame();
    }
    prevGameState.current = gameState;
  }, [gameState, initGame]);


  const update = (canvas: HTMLCanvasElement) => {
    if (gameState === GameState.GAME_OVER) return;

    const player = playerRef.current;
    
    // Horizontal Movement
    const targetX = Math.max(player.width/2, Math.min(canvas.width - player.width/2, mouseXRef.current));
    player.x += (targetX - player.x) * 0.15;
    
    // Bird Patrol Logic
    bellsRef.current.forEach(bell => {
        if (bell.active && bell.type === 'bird') {
            bell.x += bell.vx;
            // Bounce off walls
            if (bell.x < bell.width/2 + 10) {
                bell.x = bell.width/2 + 10;
                bell.vx *= -1;
            } else if (bell.x > canvas.width - bell.width/2 - 10) {
                bell.x = canvas.width - bell.width/2 - 10;
                bell.vx *= -1;
            }
        }
    });
    
    // Ground Logic
    // We calculate where the ground should be based on cameraYRef
    // cameraYRef is how far UP we have scrolled (positive number)
    // The ground is initially at `height - 50`.
    // Visually it is drawn at `height - 50 + cameraYRef`.
    
    if (gameState === GameState.MENU) {
      player.y = (canvas.height - 50) - player.height/2; 
      player.vy = 0;
      player.rotation = (targetX - player.x) * 0.05;
      isGroundedRef.current = true;
      cameraYRef.current = 0;
    } else if (gameState === GameState.PLAYING) {
      
      // Physics
      player.vy += GRAVITY;
      player.y += player.vy;

      // Rotation
      player.rotation = player.vx * 0.05 + player.vy * 0.05;

      // Camera / World Scroll (Climbing)
      const climbThreshold = canvas.height * 0.5;
      if (player.y < climbThreshold) {
        const diff = climbThreshold - player.y;
        player.y = climbThreshold;
        cameraYRef.current += diff; 
        worldHeightRef.current += diff;
        
        bellsRef.current.forEach(bell => bell.y += diff);
        particlesRef.current.forEach(p => p.y += diff);

        lastBellYRef.current += diff;
        while (lastBellYRef.current > -50) { 
           // Pass worldHeight to scale bells
           spawnBell(canvas.width, lastBellYRef.current - BELL_SPAWN_RATE, worldHeightRef.current);
           lastBellYRef.current -= BELL_SPAWN_RATE;
        }
      }

      // Camera / World Scroll (Falling)
      // If falling and near bottom, scroll world up (camera down) so we can see the fall
      const fallThreshold = canvas.height * 0.8;
      if (player.y > fallThreshold && cameraYRef.current > 0) {
          const diff = player.y - fallThreshold;
          // Only scroll if we have height to give back
          const scrollAmount = Math.min(diff, cameraYRef.current);
          
          if (scrollAmount > 0) {
              player.y -= scrollAmount;
              cameraYRef.current -= scrollAmount;
              worldHeightRef.current -= scrollAmount;
              
              bellsRef.current.forEach(bell => bell.y -= scrollAmount);
              particlesRef.current.forEach(p => p.y -= scrollAmount);
              // We move lastBellYRef UP (negative y) as well, effectively "un-scrolling"
              lastBellYRef.current -= scrollAmount; 
          }
      }

      // Ground Collision Logic
      const groundY = canvas.height - 50 + cameraYRef.current;
      
      // Check collision with ground
      if (player.vy > 0 && player.y + player.height/2 > groundY) {
         player.y = groundY - player.height/2;
         player.vy = 0;
         
         // Game Over Logic
         // If we have any score, hitting the ground is fatal
         if (scoreRef.current > 0) {
             setGameState(GameState.GAME_OVER);
             spawnParticles(player.x, player.y + 15, '#fff', 20); // Splat particles
         } else {
             // Forgiving start: if score is 0, just land
             isGroundedRef.current = true;
             multiplierRef.current = 1;
             setMultiplier(1);
         }
      } else {
         isGroundedRef.current = false;
      }

      // Cleanup Bells (only below screen)
      bellsRef.current = bellsRef.current.filter(b => b.y < canvas.height + 200);

      // Collision Detection (Bells)
      if (player.vy > 0) { // Only hit bells when falling
        bellsRef.current.forEach(bell => {
          if (!bell.active) return;
          
          const dx = player.x - bell.x;
          const dy = player.y - bell.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < (player.width/2 + bell.width/2 + 10)) {
            player.vy = JUMP_FORCE;
            if (bell.type === 'bird') player.vy *= 1.2;

            const points = (bell.type === 'bird' ? 20 : 10) * multiplierRef.current;
            scoreRef.current += points;
            setScore(scoreRef.current);
            
            multiplierRef.current += 1;
            setMultiplier(multiplierRef.current);

            bell.active = false; 
            spawnParticles(bell.x, bell.y, bell.type === 'bird' ? COLORS.bird : COLORS.bell, 10);
            bell.scale = 1.5; 
          }
        });
      }
    }

    // Update Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= 0.02;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Clear
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, COLORS.skyTop);
    gradient.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for(let i=0; i<50; i++) {
        const starX = (Math.sin(i * 132.1) * canvas.width + canvas.width) % canvas.width;
        // Adjust star parallax to account for cameraYRef
        const starY = ((Math.cos(i * 453.2) * canvas.height + cameraYRef.current * 0.1) % canvas.height + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.arc(starX, starY, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Bells
    bellsRef.current.forEach(bell => {
      if (!bell.active && bell.scale <= 0) return; 
      if (!bell.active) bell.scale -= 0.1; 
      
      ctx.save();
      ctx.translate(bell.x, bell.y);
      ctx.scale(bell.scale, bell.scale);
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = bell.type === 'bird' ? COLORS.bird : COLORS.bellGlow;
      
      if (bell.type === 'bird') {
         ctx.fillStyle = COLORS.bird;
         // Draw Bird (simple shape)
         ctx.beginPath();
         // Body
         ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
         ctx.fill();
         // Wing
         ctx.fillStyle = '#fecaca';
         ctx.beginPath();
         const wingOffset = Math.sin(Date.now() / 50) * 5;
         ctx.moveTo(-5, -2);
         ctx.lineTo(-15, -10 + wingOffset);
         ctx.lineTo(5, -2);
         ctx.fill();
      } else {
         ctx.fillStyle = COLORS.bell;
         ctx.beginPath();
         ctx.arc(0, 0, bell.width/2, 0, Math.PI * 2);
         ctx.fill();
         ctx.fillStyle = '#e2e8f0';
         ctx.beginPath();
         ctx.arc(0, 0, bell.width/3, 0, Math.PI * 2);
         ctx.fill();
      }
      ctx.restore();
    });

    // Particles
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Player
    const player = playerRef.current;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotation);
    
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
    ctx.fillStyle = '#ffffff';
    
    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.beginPath();
    ctx.ellipse(-8, -15, 4, 12, -0.2, 0, Math.PI * 2); 
    ctx.ellipse(8, -15, 4, 12, 0.2, 0, Math.PI * 2); 
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    if (Math.floor(Date.now() / 3000) % 2 === 0 && Math.random() < 0.05) {
       ctx.moveTo(-7, -2); ctx.lineTo(-3, -2);
       ctx.moveTo(3, -2); ctx.lineTo(7, -2);
       ctx.stroke();
    } else {
        ctx.arc(-5, -2, 2, 0, Math.PI * 2);
        ctx.arc(5, -2, 2, 0, Math.PI * 2);
    }
    ctx.fill();
    
    // Cheeks
    ctx.fillStyle = '#fecaca';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(-8, 2, 3, 0, Math.PI * 2);
    ctx.arc(8, 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    ctx.restore();
    
    // Ground
    // Use stored world ground position logic
    const drawGroundY = canvas.height - 50 + cameraYRef.current;
    // Only draw ground if it's on or near screen
    if (drawGroundY < canvas.height + 100) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, drawGroundY, canvas.width, canvas.height - drawGroundY + 500);
        
        const groundGrad = ctx.createLinearGradient(0, drawGroundY, 0, drawGroundY + 50);
        groundGrad.addColorStop(0, '#e2e8f0');
        groundGrad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, drawGroundY, canvas.width, 100);
    }
  };

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check resize in loop as well
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    update(canvas);
    draw(ctx, canvas);

    requestRef.current = requestAnimationFrame(tick);
  }, [gameState, update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />;
};