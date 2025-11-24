// Конфигурация приложения, загружаемая из config.json
export interface AppConfig {
  osc: {
    enabled: boolean;
    host: string;
    port: number;
    commands: {
      start: string | Array<{ address: string; delay: number }>;
      menu: string | Array<{ address: string; delay: number }>;
    };
  };
  inactivityTimeout: number; // в миллисекундах
}

// Дефолтная конфигурация
const defaultConfig: AppConfig = {
  osc: {
    enabled: true,
    host: '127.0.0.1',
    port: 8000,
    commands: {
      start: '/screen/start',
      menu: '/screen/menu'
    }
  },
  inactivityTimeout: 20000
};

let cachedConfig: AppConfig | null = null;

/**
 * Загрузка конфигурации из config.json
 */
export async function loadConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error('Failed to load config.json');
    }
    
    const config = await response.json();
    const mergedConfig = { ...defaultConfig, ...config };
    cachedConfig = mergedConfig;
    console.log('[Config] Loaded successfully:', cachedConfig);
    return mergedConfig;
  } catch (error) {
    console.warn('[Config] Failed to load, using defaults:', error);
    cachedConfig = defaultConfig;
    return defaultConfig;
  }
}

/**
 * Получить текущую конфигурацию (из кеша)
 */
export function getConfig(): AppConfig {
  if (!cachedConfig) {
    return defaultConfig;
  }
  return cachedConfig;
}
