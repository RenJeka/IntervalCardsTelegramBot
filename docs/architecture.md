# Огляд архітектури: IntervalCards Telegram Bot

## 1. Призначення і контекст

IntervalCardsTelegramBot — це проєкт на Node.js/TypeScript, який надсилає користувачам Telegram інтервальні (spaced‑repetition) картки для вивчення слів. Використовує:

- `node-telegram-bot-api` для роботи з Telegram
- AWS DynamoDB для зберігання даних
- `cron` для планування розсилок

Бот працює в режимі **polling** і спроєктований як легкий, модульний та розширюваний.

## 2. Точка входу

- **Bootstrapping:** `src/index.ts` завантажує конфіг з `.env` через `dotenv`, створює `TelegramBot` з polling, реєструє команди (`/start`, `/instruction`, `/set_interval`).
- **DI (інʼєкція залежностей):** у `index.ts` створюються сервіси `DbAwsService`, `ScheduleService`, `MessageService` і передаються у хендлери — точка входу лишається тонкою.
- **Обробники подій:** події `message` та `callback_query` делегуються в `MessageService`, який маршрутизує їх залежно від стану користувача та даних повідомлення/колбеку.

## 3. High-level tree 

```
.
├── AGENTS.md
├── LICENSE
├── README.md
├── dockerfile
├── package.json
├── package-lock.json
├── tsconfig.json
├── docs
│   ├── architecture-rules.md
│   ├── architecture.md
│   ├── requirements.md
│   └── tasksTrackingSystem.md
├── src
│   ├── const        # константи, enum-и, клавіатури
│   ├── common       # спільні типи/інтерфейси та базові структури
│   ├── helpers      # утиліти для парсингу/форматування
│   ├── services     # бізнес-логіка, робота з БД, планувальник, меседжинг
│   └── index.ts
├── dist            # зібраний JS (генерований)
└── node_modules
```

## 4. Основні модулі

### 4.1 `DbAwsService`

- **Роль:** інкапсулює всю взаємодію з AWS DynamoDB. Перевіряє наявність таблиць на старті та надає CRUD‑операції.
- **Таблиці:** використовуються 2 таблиці — `users` і `words`. Назви беруться з env.
  - `users`: `_id`, `status`, `interval`
  - `words`: `_id`, `user_id`, `word`, опційно `translation`, `example`, `comment`
- **Операції:** `initUser`, `writeWordByUserId` (з перевіркою дубліката), `removeWordById`, `setUserStatus`, `getUserStatus`, `setUserInterval`, `getUserInterval`, `getUserDictionary`, `getAllUsersWithStatus`, `checkIsUserExist`.
- **Технології:** AWS SDK v3 (`@aws-sdk/client-dynamodb`) + `marshall/unmarshall`. Для простоти використовуються `Scan` запити.

### 4.2 `ScheduleService`

- **Роль:** керує плануванням повідомлень для кожного користувача. Для активного користувача створюється `CronJob`, який зберігається в `Map<userId, CronJob>`.
- **Логіка cron:**
  - **prod:** кожні *n* годин у проміжку 09:00–22:00
  - **dev:** кожні кілька секунд (для швидкої перевірки)
- **Відновлення сесій:** на старті сканує `users` за `status=START_LEARN` і перевстановлює cron‑джоби.

### 4.3 `MessageService`

- **Роль:** “контролер” застосунку + реалізація FSM (станів). Приймає команди/кнопки, змінює стан користувача, працює з БД, запускає/зупиняє планувальник.
- **Ключові хендлери:** `startMessageHandler`, `instructionMessageHandler`, `setIntervalMessageHandler`, `addWordMessageHandler`, `removeWordMessageHandler`, `getAllMessagesHandler`, `startLearn`, `stopLearn`.
- **Маршрутизація:** `generalMessageHandler` та `generalCallbackHandler` роблять routing залежно від поточного `UserStatus`.
- **UI:** використовує reply/inline клавіатури з `src/const/keyboards.ts`.

### 4.4 Helpers і константи

- **Enums:**
  - `MainReplyKeyboardData` — підписи кнопок меню
  - `UserStatus` — стани FSM: `DEFAULT`, `ADD_WORD`, `REMOVE_WORD`, `START_LEARN`, `STOP_LEARN`, `SET_INTERVAL`, `SET_LANGUAGE`, `FAVORITE_CATEGORIES`
- **Helpers:**
  - `CommonHelper.parseUserRawItem` парсить введення користувача по роздільнику `/` на `word`, `translation`, `example`, `comment`
  - `FormatterHelper.escapeMarkdownV2` екранує спецсимволи MarkdownV2
- **Константи:** `ADD_USER_ITEM_SEPARATOR`, `DEFAULT_USER_INTERVAL`, `DEVELOPER_MODE_BOT_SENDS_MESSAGE_SEC`.

### 4.5 `i18n.service` (Internationalization)

- **Роль:** надає інтернаціоналізацію для всіх текстів інтерфейсу користувача за допомогою бібліотеки `i18next`.
- **Підтримувані мови:** English (`en`), Ukrainian (`uk`).
- **Функції:**
  - `t(key, lang, params?)` — повертає локалізований рядок
  - `detectLanguage(telegramLangCode)` — визначає мову з Telegram settings
  - `getLanguageDisplayName(lang)` — повертає назву мови для відображення
- **Файли перекладів:** `src/locales/en.json`, `src/locales/uk.json`

## 5. FSM (машина станів)

FSM базується на `UserStatus`, який зберігається в `users` (DynamoDB). `MessageService` читає стан і викликає відповідний обробник.

Приклади:

- `ADD_WORD`: текстові повідомлення трактуються як “слово для додавання” → `writeWordByUserId`
- `REMOVE_WORD`: callback data трактуються як “id слова для видалення” → `removeWordById`
- `DEFAULT`: показ головного меню/вітального повідомлення

Перехід між станами запускається командами/кнопками (наприклад, `➕️ Add word` переводить у `ADD_WORD`). Оскільки стан зберігається в DynamoDB — він переживає рестарти бота.

## 6. Модель даних

- **User:** `_id` (Telegram user id), `status` (`UserStatus`), `interval` (години), `language` (код мови, опційно), `favoriteCategories` (масив категорій, опційно). Створюється ліниво через `initUser` з дефолтами: `DEFAULT`, `1 год`, мова визначається з Telegram settings.
- **Word:** `_id` (timestamp), `user_id` (string), `word`, опційно `translation`, `example`, `comment`. Видалення виконується по ключу (`_id`, `user_id`).

## 7. Потік планування

1. Користувач натискає “Start learning”.
2. `MessageService.startLearn` перевіряє наявність слів і ставить `status=START_LEARN`.
3. Читає `interval` (або default) і викликає `ScheduleService.startLearnByUserId` → створюється cron‑джоба.
4. `ScheduleService` зберігає джобу в пам’яті та може:
   - зупинити її (`stopLearnByUserId`)
   - відновити після рестарту (`resumeAllStartLearning`)

## 8. Деплой і конфігурація

- Один процес Node.js на OrangePi Zero 3 (Debian), режим polling.
- Конфіг і секрети — лише через env (не комітити в репозиторій).
- Режими: dev/prod керуються `NODE_ENV`.
- Часовий пояс: `Europe/Kyiv`.
