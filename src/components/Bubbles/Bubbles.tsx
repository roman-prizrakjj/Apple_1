import React, { useEffect, useState, useRef } from 'react';
import './Bubbles.css';

type Bubble = {
  id: number;
  left: number; // percent
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  wobbleType: string; // wobble animation type
  swayAmplitude: number; // vw - амплитуда покачивания
  swayDirection: number; // 1 или -1 - направление
};

const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Toggle between bubble styles: 'rainbow' (current) or 'gradient' (new)
const BUBBLE_STYLE = 'gradient' as 'rainbow' | 'gradient';

const Bubbles: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [particles, setParticles] = useState<Array<any>>([]);
  const idRef = useRef(1);
  const spawnTimer = useRef<number | null>(null);
  const mounted = useRef(true);

  // Array of available pop sounds
  const soundFiles = [
    '/assets/bubble-pop-v2.wav',
    '/assets/bubble-pop-v3.wav',
    '/assets/bubble-pop-v4.wav'
  ];

  useEffect(() => {
    mounted.current = true;

    // Проверка пересечения пузырей
    const checkOverlap = (newLeft: number, newSize: number, existingBubbles: Bubble[]): boolean => {
      const newLeftPx = (newLeft / 100) * window.innerWidth;
      const newRadius = newSize / 2;
      
      for (const bubble of existingBubbles) {
        const existingLeftPx = (bubble.left / 100) * window.innerWidth;
        const existingRadius = bubble.size / 2;
        const distance = Math.abs(newLeftPx - existingLeftPx);
        const minDistance = newRadius + existingRadius + 20; // 20px минимальный зазор
        
        if (distance < minDistance) {
          return true; // пересечение найдено
        }
      }
      return false; // пересечений нет
    };

    const spawn = () => {
      // limit total bubbles to avoid overload
      const MAX_BUBBLES = 20; // уменьшено с 40
      setBubbles((s) => {
        const toAdd = [] as Bubble[];
        const currentCount = s.length;
        if (currentCount >= MAX_BUBBLES) return s;
        // spawn 1..2 bubbles per tick (было 1..3)
        const spawnCount = Math.floor(random(1, 3));
        const wobbleTypes = ['wobble-horizontal-soft', 'wobble-horizontal-strong', 'wobble-vertical-soft', 'wobble-vertical-strong'];
        
        for (let i = 0; i < spawnCount && toAdd.length + currentCount < MAX_BUBBLES; i++) {
          let left: number;
          let size: number;
          let attempts = 0;
          const maxAttempts = 10;
          
          // Пытаемся найти позицию без пересечений
          do {
            left = random(5, 95);
            size = Math.round(random(160, 360)); // увеличено в 2 раза: было 80-180
            attempts++;
          } while (checkOverlap(left, size, [...s, ...toAdd]) && attempts < maxAttempts);
          
          // Если не нашли свободное место за 10 попыток, пропускаем этот пузырь
          if (attempts >= maxAttempts) continue;
          
          const id = idRef.current++;
          // медленнее: 26-44 секунд (было 10-35)
          const duration = Number(random(26, 44).toFixed(2));
          const delay = Number(random(0, 1.5).toFixed(2));
          const wobbleType = wobbleTypes[Math.floor(Math.random() * wobbleTypes.length)];
          const swayAmplitude = Number(random(6, 16).toFixed(1)); // 6-16vw
          const swayDirection = Math.random() > 0.5 ? 1 : -1;
          toAdd.push({ id, left, size, duration, delay, wobbleType, swayAmplitude, swayDirection });
        }
        return [...s, ...toAdd];
      });

      // schedule next spawn (more frequent)
      const next = random(200, 700);
      spawnTimer.current = window.setTimeout(() => {
        if (mounted.current) spawn();
      }, next);
    };

    spawn();

    return () => {
      mounted.current = false;
      if (spawnTimer.current) clearTimeout(spawnTimer.current);
    };
  }, []);

  const handlePop = (id: number, event: React.MouseEvent | React.TouchEvent) => {
    const el = document.getElementById(`bubble-${id}`);
    if (el) {
      el.classList.add('pop');
    }
    
    // Play random pop sound
    try {
      const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)];
      const audio = new Audio(randomSound);
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch (e) {
      // ignore
    }
    
    // Get click/touch coordinates
    let clickX: number;
    let clickY: number;
    
    if ('touches' in event && event.touches.length > 0) {
      clickX = event.touches[0].clientX;
      clickY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clickX = event.clientX;
      clickY = event.clientY;
    } else {
      return;
    }
    
    console.debug('Particle spawn at click:', { clickX, clickY });
    
    // Create particles at click position
    const parts: any[] = [];
    
    // Main water droplets
    for (let i = 0; i < 12; i++) {
      const angle = random(-Math.PI, Math.PI);
      const dist = random(30, 100);
      const dx = Math.round(Math.cos(angle) * dist);
      const dy = Math.round(Math.sin(angle) * dist) - Math.round(random(8, 25));
      const size = Math.round(random(6, 16));
      const pid = `p_${Date.now()}_${i}`;
      parts.push({ id: pid, x: clickX, y: clickY, dx: `${dx}px`, dy: `${dy}px`, size, type: 'splash' });
    }
    
    // Fine mist
    for (let i = 0; i < 6; i++) {
      const angle = random(-Math.PI, Math.PI);
      const dist = random(15, 50);
      const dx = Math.round(Math.cos(angle) * dist);
      const dy = Math.round(Math.sin(angle) * dist) - Math.round(random(5, 12));
      const size = Math.round(random(3, 8));
      const pid = `m_${Date.now()}_${i}`;
      parts.push({ id: pid, x: clickX, y: clickY, dx: `${dx}px`, dy: `${dy}px`, size, type: 'mist' });
    }
    
    console.debug('Created particles:', parts.length);
    setParticles((s) => [...s, ...parts]);
    
    // Cleanup particles after animation
    setTimeout(() => {
      setParticles((s) => s.filter((p) => !parts.find((pp) => pp.id === p.id)));
    }, 1200);
    
    // Remove bubble after pop animation
    setTimeout(() => {
      setBubbles((s) => s.filter((b) => b.id !== id));
    }, 350);
  };

  const handleFloatEnd = (id: number) => {
    setBubbles((s) => s.filter((b) => b.id !== id));
  };

  // respect reduced motion
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="bubbles-root" aria-hidden>
      {bubbles.map((b) => (
        <div
          key={b.id}
          id={`bubble-${b.id}`}
          className="bubble"
          onClick={(e) => handlePop(b.id, e)}
          onTouchStart={(e) => handlePop(b.id, e)}
          onAnimationEnd={(e) => {
            // if float animation ended, cleanup
            // access animationName in a safe, untyped way to satisfy TS
            const anyE = e as unknown as { animationName?: string };
            if (anyE.animationName === 'floatUp') handleFloatEnd(b.id);
          }}
          style={
            reduceMotion
              ? { left: `${b.left}%`, width: b.size, height: b.size }
              : {
                  left: `${b.left}%`,
                  width: b.size,
                  height: b.size,
                  animationDuration: `${b.duration}s, 8s, 0.35s`,
                  animationDelay: `${b.delay}s, 0s, 0s`,
                  ['--sway-amplitude' as any]: `${b.swayAmplitude}vw`,
                  ['--sway-direction' as any]: b.swayDirection,
                }
          }
        >
          <div 
            className={`bubble__inner bubble__inner--${BUBBLE_STYLE}`}
            style={{
              animationName: b.wobbleType,
              animationDuration: '2s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite'
            }}
          >
            {BUBBLE_STYLE === 'rainbow' && <span></span>}
          </div>
        </div>
      ))}
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle ${p.type === 'mist' ? 'particle--mist' : 'particle--splash'}`}
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            // CSS custom properties for animation delta
            ['--dx' as any]: p.dx,
            ['--dy' as any]: p.dy,
          }}
        />
      ))}
    </div>
  );
};

export default Bubbles;
