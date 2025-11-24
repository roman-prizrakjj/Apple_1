const osc = require('osc');
const fs = require('fs');
const path = require('path');

class OSCClient {
  constructor() {
    this.udpPort = null;
    this.config = null;
    this.configPath = null;
    this.configWatcher = null;
  }

  /**
   * Инициализация OSC клиента
   * @param {string} configPath - путь к config.json
   */
  init(configPath) {
    this.configPath = configPath;
    
    // Загружаем конфиг
    this.loadConfig();
    
    // Создаем UDP порт для отправки OSC сообщений
    if (this.config.osc.enabled) {
      this.createUDPPort();
    }
    
    // Следим за изменениями конфига
    this.watchConfig();
    
    console.log('[OSC] Client initialized with config:', this.config.osc);
  }

  /**
   * Загрузка конфигурации из файла
   */
  loadConfig() {
    try {
      console.log('[OSC] Trying to load config from:', this.configPath);
      console.log('[OSC] Config file exists:', fs.existsSync(this.configPath));
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      console.log('[OSC] Config loaded successfully');
    } catch (error) {
      console.error('[OSC] Failed to load config:', error.message, ', config.json not found in', this.configPath);
      // Используем дефолтный конфиг
      this.config = {
        osc: {
          enabled: true,
          host: '127.0.0.1',
          port: 8000,
          commands: {
            start: '/screen/start',
            menu: '/screen/menu'
          }
        }
      };
    }
  }

  /**
   * Создание UDP порта для OSC
   */
  createUDPPort() {
    // Закрываем старый порт если есть
    if (this.udpPort) {
      this.udpPort.close();
    }

    this.udpPort = new osc.UDPPort({
      localAddress: '0.0.0.0',
      localPort: 0, // случайный свободный порт
      remoteAddress: this.config.osc.host,
      remotePort: this.config.osc.port,
      metadata: true
    });

    this.udpPort.on('ready', () => {
      console.log(`[OSC] UDP port ready. Sending to ${this.config.osc.host}:${this.config.osc.port}`);
    });

    this.udpPort.on('error', (error) => {
      console.error('[OSC] UDP port error:', error);
    });

    this.udpPort.open();
  }

  /**
   * Отслеживание изменений конфига
   */
  watchConfig() {
    if (this.configWatcher) {
      this.configWatcher.close();
    }

    // Не следим за файлами внутри asar (fs.watch не работает с asar)
    if (this.configPath.includes('.asar')) {
      console.log('[OSC] Config inside asar, watcher disabled');
      return;
    }

    try {
      this.configWatcher = fs.watch(this.configPath, (eventType) => {
        if (eventType === 'change') {
          console.log('[OSC] Config file changed, reloading...');
          
          // Небольшая задержка перед чтением (файл может быть не полностью записан)
          setTimeout(() => {
            this.loadConfig();
            
            // Пересоздаем UDP порт с новыми настройками
            if (this.config.osc.enabled) {
              this.createUDPPort();
            } else if (this.udpPort) {
              this.udpPort.close();
              this.udpPort = null;
            }
          }, 100);
        }
      });

      console.log('[OSC] Config watcher started');
    } catch (error) {
      console.warn('[OSC] Failed to start config watcher:', error.message);
    }
  }

  /**
   * Отправка OSC команды при смене экрана
   * @param {string} screenName - 'start' или 'menu'
   */
  sendScreenChange(screenName) {
    if (!this.config.osc.enabled || !this.udpPort) {
      return;
    }

    const commands = this.config.osc.commands[screenName];
    if (!commands) {
      console.warn(`[OSC] Unknown screen name: ${screenName}`);
      return;
    }

    // Поддержка как массива команд, так и старого формата (строка)
    const commandList = Array.isArray(commands) ? commands : [{ address: commands, delay: 0 }];

    // Отправляем каждую команду с задержкой
    commandList.forEach((cmd, index) => {
      setTimeout(() => {
        try {
          // Отправляем только адрес без параметров
          this.udpPort.send({
            address: cmd.address
          });
          
          console.log(`[OSC] Sent [${index + 1}/${commandList.length}]: ${cmd.address} (delay: ${cmd.delay}ms)`);
        } catch (error) {
          console.error(`[OSC] Failed to send message ${cmd.address}:`, error);
        }
      }, cmd.delay || 0);
    });
  }

  /**
   * Закрытие OSC клиента
   */
  close() {
    if (this.configWatcher) {
      this.configWatcher.close();
    }
    if (this.udpPort) {
      this.udpPort.close();
    }
    console.log('[OSC] Client closed');
  }
}

module.exports = new OSCClient();
