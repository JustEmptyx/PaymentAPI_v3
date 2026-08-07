# PaymentAPI v3

Node.js-приложение для тестирования и интеграции с Open Banking Payment API (NBRB, Республика Беларусь).

Проект включает веб-интерфейс для интерактивного вызова endpoint'ов, модули авторизации (PISP / QPISP / TPE / OB), подписи и валидации запросов по JSON-схемам.

## Возможности

- **Авторизация**: получение токенов PISP, QPISP, TPE и Open Banking (client credentials, client assertion JWT).
- **Платежи**: создание согласий и платежей различных типов — domestic, domesticTax, listAccounts, listPassports, requirement, taxRequirement, VRP.
- **Счета и выписки**: работа со счетами, балансами, выписками и транзакциями (AISP).
- **Intents**: управление payment intents и account intents.
- **Веб-интерфейс**: группировка функций, редактор JSON, история вызовов, сессии.
- **Валидация**: проверка тел запросов по JSON-схемам NBRB из каталога `schemes/`.
- **Docker**: готовый Dockerfile и docker-compose для запуска в контейнере.

## Технологии

- Node.js 18+
- Express.js
- Axios
- AJV (JSON Schema validation)
- date-fns / date-fns-tz
- uuid, base64url
- Docker

## Установка

```bash
# Клонирование репозитория
git clone <url-репозитория>
cd PaymentAPI_v3

# Установка зависимостей корневого проекта
npm install

# Установка зависимостей веб-интерфейса
cd web-interface
npm install
cd ..
```

## Запуск

### Локально

```bash
node web-interface/server.js
```

Сервер поднимается на порту `3000` (или на том, что указан в переменной `PORT`).

Откройте в браузере: http://localhost:3000

### Docker

```bash
docker-compose up --build
```

Контейнер доступен по адресу: http://localhost:3000

## Структура проекта

```
PaymentAPI_v3/
├── web-interface/          # Веб-сервер и UI
│   ├── public/               # Статика (HTML, CSS, JS, изображения)
│   ├── server.js             # Express-сервер
│   └── package.json
├── schemes/                  # JSON-схемы NBRB
├── schemes-mapping.json      # Маппинг endpoint → схема
├── PISPauthNew.js            # Модуль авторизации и вызова API
├── defaultBodies.js          # Шаблоны тел запросов
├── requestBodies.js          # Управление телами запросов
├── clientSecretJWTAuth.js    # Генерация client assertion JWT
├── cryptoManager.js          # Криптографические операции
├── Signature.js              # Подпись запросов
├── base64converter.js        # Утилиты base64/base64url
├── utils.js                  # Вспомогательные функции
├── fileManager.js            # Работа с файлами
├── dateModule.js             # Утилиты дат
├── docker-compose.yml        # Docker Compose
└── Dockerfile                # Dockerfile
```

## Конфигурация

Основные параметры подключения и учётные данные по умолчанию задаются в `PISPauthNew.js` (объект `defaultConfig`) и могут быть переопределены через веб-интерфейс:

- URL Keycloak (`url_kc`)
- URL Swagger/API (`url_swagger`, `baseUrl`)
- client_id / client_secret для PISP, QPISP, TPE, DBO
- apikey
- subjectKeyIdentifier, пароль подписи, номер телефона для OTP

> В продакшене рекомендуется выносить чувствительные данные в переменные окружения или внешнее хранилище секретов.

## API сервера (веб-интерфейс)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/functions` | список всех функций по группам |
| GET | `/api/defaultBody/:name` | тело запроса по умолчанию |
| GET | `/api/context/:name` | текущий контекст функции |
| POST | `/api/context/:name` | сохранить контекст функции |
| POST | `/api/execute/:name` | выполнить функцию |
| POST | `/api/executeSequence` | выполнить последовательность |
| GET | `/api/session` | информация о сессии |
| GET/POST | `/api/config` | получить/обновить конфигурацию |
| POST | `/api/validate` | валидировать JSON по схеме |

## Скрипты

Корневой `package.json`:

```bash
npm start    # node server.js
npm run build # node server.js
```

`web-interface/package.json`:

```bash
npm start    # node server.js
npm run dev  # nodemon server.js
```

## Лицензия

ISC
