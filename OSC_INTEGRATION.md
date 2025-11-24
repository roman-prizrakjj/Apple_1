# OSC Integration Guide

## Описание

Приложение отправляет OSC команды при смене экранов. Конфигурация читается из внешнего файла `config.json` и может быть изменена "на горячую" без перезапуска приложения.

## Структура файлов

```
dist-electron/
  AppleTouchPanel.exe
  config.json          ← внешний конфиг (редактируется пользователем)

electron/
  main.cjs             ← главный процесс Electron
  oscClient.cjs        ← OSC клиент
  preload.cjs          ← bridge между main и renderer

src/
  App.tsx              ← отправка команд при смене экрана
  types/electron.d.ts  ← TypeScript типы
```

## config.json

```json
{
  "osc": {
    "enabled": true,
    "host": "127.0.0.1",
    "port": 8000,
    "commands": {
      "start": "/screen/start",
      "menu": "/screen/menu"
    }
  }
}
```

### Параметры:

- **enabled** (boolean) - включить/выключить отправку OSC команд
- **host** (string) - IP адрес получателя OSC команд
- **port** (number) - UDP порт получателя
- **commands** (object) - OSC адреса для каждого экрана
  - **start** - команда для стартового экрана
  - **menu** - команда для экрана с пузырями

## Использование

### Development режим

1. Файл конфига находится в корне проекта: `Apple/config.json`
2. При изменении конфига приложение автоматически перечитывает настройки
3. Запуск: `npm run electron:dev`

### Production режим

1. После сборки (`npm run electron:build`) конфиг должен лежать рядом с `.exe`:
```
dist-electron/
  win-unpacked/
    AppleTouchPanel.exe
config.json          ← поместить сюда
```

2. Редактируй `config.json` в любом текстовом редакторе
3. Сохрани файл - приложение автоматически применит изменения

## OSC Протокол

### Отправляемые сообщения

**Стартовый экран:**
```
Address: /screen/start (или из config.commands.start)
Args: ["start"]
Type: String
```

**Экран с пузырями:**
```
Address: /screen/menu (или из config.commands.menu)
Args: ["menu"]
Type: String
```

### Тестирование

Используй любой OSC receiver для проверки:

**Python (python-osc):**
```python
from pythonosc import dispatcher, osc_server

def screen_handler(address, *args):
    print(f"Received: {address} - {args}")

disp = dispatcher.Dispatcher()
disp.map("/screen/*", screen_handler)

server = osc_server.ThreadingOSCUDPServer(("0.0.0.0", 8000), disp)
print("OSC Server listening on port 8000")
server.serve_forever()
```

**TouchOSC / OSCulator:**
- Настрой прием на порт из конфига (default: 8000)
- Слушай адреса `/screen/start` и `/screen/menu`

## Логи

В консоли Electron (DevTools) будут логи:
```
[OSC] Client initialized with config: { enabled: true, host: '127.0.0.1', port: 8000, ... }
[OSC] UDP port ready. Sending to 127.0.0.1:8000
[OSC] Config file changed, reloading...
[IPC] Screen changed to: menu
[OSC] Sent: /screen/menu (menu)
```

## Troubleshooting

### OSC команды не отправляются
1. Проверь `config.json` - `enabled: true`
2. Проверь IP и порт получателя
3. Проверь что получатель запущен и слушает указанный порт
4. Проверь firewall - разреши UDP трафик

### Конфиг не перечитывается
1. Убедись что файл сохраняется полностью (не поврежден)
2. Проверь права доступа к файлу
3. Посмотри логи в DevTools

### Ошибки в production
- Убедись что `config.json` лежит рядом с `.exe`
- Путь: `dist-electron/win-unpacked/config.json`
