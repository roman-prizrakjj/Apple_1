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

// ===== КОНФИГУРАЦИЯ ПУЗЫРЕЙ =====
const BUBBLE_CONFIG = {
  // Стиль пузырей: 'rainbow', 'gradient' или 'blue'
  STYLE: 'blue' as 'rainbow' | 'gradient' | 'blue',
  
  // Эффекты анимации
  ENABLE_SHIMMER: false,    // Включить/выключить эффект переливания цвета у пузырей
  ENABLE_FADE: false,       // Включить/выключить затухание пузырей при падении (opacity)
  ENABLE_BREATHE: false,    // Включить/выключить эффект "дыхания" (изменение яркости)
  
  // Видео триггер
  ENABLE_VIDEO: false,       // Включить/выключить запуск видео после лопания пузырей
  VIDEO_TRIGGER_COUNT: 5,   // Количество пузырей, которые нужно лопнуть для запуска видео
  VIDEO_PATH: '/assets/video.mp4', // Путь к видео файлу
  
  // Автовозврат при неактивности
  ENABLE_INACTIVITY_TIMEOUT: true,  // Включить/выключить автовозврат на главный экран
  INACTIVITY_TIMEOUT: 20000,        // Время неактивности в миллисекундах (30 секунд)
  
  // Количество пузырей
  INITIAL_COUNT: 0,        // Начальное заполнение при старте
  MIN_COUNT: 3,            // Минимальное количество на экране
  GROUP_SIZE_MIN: 3,        // Минимум пузырей в группе
  GROUP_SIZE_MAX: 5,        // Максимум пузырей в группе (будет 5-7)
  
  // Размеры пузырей (в пикселях)
  SIZE_MIN: 160,            // Минимальный размер
  SIZE_MAX: 360,            // Максимальный размер
  SIZE_FALLBACK_MIN: 120,   // Минимум для маленьких пузырей (при нехватке места)
  SIZE_FALLBACK_MAX: 200,   // Максимум для маленьких пузырей
  
  // Скорость падения (в секундах)
  DURATION_MIN: 20,         // Быстрые пузыри
  DURATION_MAX: 50,         // Медленные пузыри
  
  // Покачивание (в vw)
  SWAY_MIN: 6,              // Минимальная амплитуда
  SWAY_MAX: 16,             // Максимальная амплитуда
  
  // Таймеры (в миллисекундах)
  GROUP_INTERVAL: 6000,     // Интервал между группами пузырей
  MAINTAIN_CHECK: 3000,     // Интервал проверки минимального количества
  INITIAL_SPAWN_DELAY: 100, // Задержка между начальными пузырями
  GROUP_SPAWN_DELAY: 200,   // Задержка между пузырями в группе
  MIN_MAINTAIN_DELAY: 150,  // Задержка при добавлении до минимума
  
  // Коллизии
  MIN_DISTANCE: 5,         // Минимальный зазор между пузырями (в пикселях)
  MAX_SPAWN_ATTEMPTS: 10,   // Максимум попыток найти свободное место
};

interface BubblesProps {
  onVideoTrigger?: () => void;
  onInactivityTimeout?: () => void;
  inactivityTimeout?: number;
}

const Bubbles: React.FC<BubblesProps> = ({ onVideoTrigger, onInactivityTimeout, inactivityTimeout = BUBBLE_CONFIG.INACTIVITY_TIMEOUT }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [particles, setParticles] = useState<Array<any>>([]);
  const [_poppedCount, setPoppedCount] = useState(0);
  const [spawningEnabled, setSpawningEnabled] = useState(true);
  const idRef = useRef(1);
  const mounted = useRef(true);
  const videoTriggered = useRef(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Array of available pop sounds
  const soundFiles = [
    `${import.meta.env.BASE_URL}assets/bubble-pop-v2.wav`,
    `${import.meta.env.BASE_URL}assets/bubble-pop-v3.wav`,
    `${import.meta.env.BASE_URL}assets/bubble-pop-v4.wav`
  ];

  // Функция для сброса таймера неактивности
  const resetInactivityTimer = () => {
    if (!BUBBLE_CONFIG.ENABLE_INACTIVITY_TIMEOUT || !onInactivityTimeout) return;
    
    // Очищаем старый таймер
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Запускаем новый таймер с настраиваемым временем
    inactivityTimerRef.current = setTimeout(() => {
      onInactivityTimeout();
    }, inactivityTimeout);
  };

  // Запуск таймера при монтировании и очистка при размонтировании
  useEffect(() => {
    resetInactivityTimer();
    
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

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
        const minDistance = newRadius + existingRadius + BUBBLE_CONFIG.MIN_DISTANCE;
        
        if (distance < minDistance) {
          return true; // пересечение найдено
        }
      }
      return false; // пересечений нет
    };

    // Функция для создания одного пузыря
    const createBubble = () => {
      setBubbles((s) => {
        // Не ограничиваем количество - пусть создаются по таймеру
        
        let left: number;
        let size: number;
        let attempts = 0;
        const wobbleTypes = ['wobble-horizontal-soft', 'wobble-horizontal-strong', 'wobble-vertical-soft', 'wobble-vertical-strong'];
        
        // Пытаемся найти позицию без пересечений
        do {
          left = random(5, 95);
          size = Math.round(random(BUBBLE_CONFIG.SIZE_MIN, BUBBLE_CONFIG.SIZE_MAX));
          attempts++;
        } while (checkOverlap(left, size, s) && attempts < BUBBLE_CONFIG.MAX_SPAWN_ATTEMPTS);
        
        // Если не нашли свободное место, создаем с меньшим размером
        if (attempts >= BUBBLE_CONFIG.MAX_SPAWN_ATTEMPTS) {
          size = Math.round(random(BUBBLE_CONFIG.SIZE_FALLBACK_MIN, BUBBLE_CONFIG.SIZE_FALLBACK_MAX));
          left = random(10, 90);
        }
        
        const id = idRef.current++;
        const duration = Number(random(BUBBLE_CONFIG.DURATION_MIN, BUBBLE_CONFIG.DURATION_MAX).toFixed(2));
        const delay = 0; // без задержки для непрерывного потока
        const wobbleType = wobbleTypes[Math.floor(Math.random() * wobbleTypes.length)];
        const swayAmplitude = Number(random(BUBBLE_CONFIG.SWAY_MIN, BUBBLE_CONFIG.SWAY_MAX).toFixed(1));
        const swayDirection = Math.random() > 0.5 ? 1 : -1;
        
        return [...s, { id, left, size, duration, delay, wobbleType, swayAmplitude, swayDirection }];
      });
    };

    // Непрерывный спавн групп пузырей
    const startSpawning = () => {
      const spawnInterval = setInterval(() => {
        if (mounted.current && spawningEnabled) {
          // Создаем группу из 5-7 пузырей
          const groupSize = Math.floor(random(BUBBLE_CONFIG.GROUP_SIZE_MIN, BUBBLE_CONFIG.GROUP_SIZE_MAX));
          for (let i = 0; i < groupSize; i++) {
            setTimeout(() => {
              if (mounted.current && spawningEnabled) createBubble();
            }, i * BUBBLE_CONFIG.GROUP_SPAWN_DELAY);
          }
        }
      }, BUBBLE_CONFIG.GROUP_INTERVAL);
      
      return spawnInterval;
    };

    // Таймер для поддержания минимального количества пузырей
    const maintainMinimum = () => {
      const checkInterval = setInterval(() => {
        if (mounted.current && spawningEnabled) {
          setBubbles((s) => {
            if (s.length < BUBBLE_CONFIG.MIN_COUNT) {
              // Добавляем пузыри до минимума
              const toAdd = BUBBLE_CONFIG.MIN_COUNT - s.length;
              for (let i = 0; i < toAdd; i++) {
                setTimeout(() => {
                  if (mounted.current && spawningEnabled) createBubble();
                }, i * BUBBLE_CONFIG.MIN_MAINTAIN_DELAY);
              }
            }
            return s;
          });
        }
      }, BUBBLE_CONFIG.MAINTAIN_CHECK);
      
      return checkInterval;
    };

    // Начальное заполнение
    for (let i = 0; i < BUBBLE_CONFIG.INITIAL_COUNT; i++) {
      setTimeout(() => {
        if (mounted.current) createBubble();
      }, i * BUBBLE_CONFIG.INITIAL_SPAWN_DELAY);
    }

    const intervalId = startSpawning();
    const maintainId = maintainMinimum();

    return () => {
      mounted.current = false;
      clearInterval(intervalId);
      clearInterval(maintainId);
    };
  }, [spawningEnabled]);

  // Функция для лопания всех оставшихся пузырей
  const popAllBubbles = () => {
    const currentBubbles = [...bubbles];
    
    // Лопаем все пузыри одновременно (без задержки и БЕЗ звука)
    currentBubbles.forEach((bubble) => {
      const el = document.getElementById(`bubble-${bubble.id}`);
      if (el) {
        el.classList.add('pop');
        // Звук при массовом лопании отключен
      }
      
      // Remove bubble after pop animation
      setTimeout(() => {
        setBubbles((s) => s.filter((b) => b.id !== bubble.id));
      }, 350);
    });
    
    // Вызываем callback для запуска видео после того как все пузыри исчезнут
    if (BUBBLE_CONFIG.ENABLE_VIDEO && onVideoTrigger && !videoTriggered.current) {
      videoTriggered.current = true;
      const totalTime = 400; // время анимации лопания
      setTimeout(() => {
        onVideoTrigger();
      }, totalTime);
    }
  };

  const handlePop = (id: number, event: React.MouseEvent | React.TouchEvent) => {
    // Сбрасываем таймер неактивности при каждом взаимодействии
    resetInactivityTimer();
    
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
    
    // Увеличиваем счётчик лопнутых пузырей
    if (BUBBLE_CONFIG.ENABLE_VIDEO) {
      setPoppedCount((prev) => {
        const newCount = prev + 1;
        
        // Проверяем, достигли ли триггера
        if (newCount >= BUBBLE_CONFIG.VIDEO_TRIGGER_COUNT && !videoTriggered.current) {
          // Останавливаем спавн новых пузырей
          setSpawningEnabled(false);
          
          // Лопаем все оставшиеся пузыри
          setTimeout(() => {
            popAllBubbles();
          }, 100);
        }
        
        return newCount;
      });
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
          className={`bubble ${!BUBBLE_CONFIG.ENABLE_FADE ? 'no-fade' : ''} ${!BUBBLE_CONFIG.ENABLE_BREATHE ? 'no-breathe' : ''}`}
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
            className={`bubble__inner bubble__inner--${BUBBLE_CONFIG.STYLE} ${!BUBBLE_CONFIG.ENABLE_SHIMMER ? 'no-shimmer' : ''}`}
            style={{
              animationName: b.wobbleType,
              animationDuration: '2s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite'
            }}
          >
            {BUBBLE_CONFIG.STYLE === 'rainbow' && <span></span>}
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
