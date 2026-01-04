# CURRENT WORK:

#### CURRENT TASKS:

```
TODO: ICTB-10 Implement translation
TODO: ICTB-13 add button to check user status (user mode)
TODO: ICTB-17 add logging. - Ask ChatGPT and analyze where to display logs and which option is best.
TODO: ICTB-29 'Finish and continue learning' button (when we add word)
TODO: ICTB-30 check add word for code injection (threat check)
TODO: ICTB-36 add Trello as a task tracking system (realize what account we can use for it) (low priority)
TODO: ICTB-39 add AI connections to implement examples using AI APIs via Open Router (https://openrouter.ai/).


```

---

##### 04/01/2026

## TODO: ICTB-39 add AI connections to implement examples using AI APIs via Open Router (https://openrouter.ai/).
## TODO: ICTB-40 in development mode env file should be named .env.development
## TODO: ICTB-41 Preset words (e.g. 100 random words).
## TODO: ICTB-42 Categories"favorite" in settings. (add in the user settings the ability to add favorite words-categories, on the basis of which examples from LLM and 100 random words will be formed)
## TODO: ICTB-43 add to the settings the language that the user is currently learning or leave this field as undefined.
## TODO: ICTB-44 - Add 15, 30, and 45 minutes to the interval settings in the settings menu. Convert hours to minutes for the info interval.
## TODO: ICTB-45  Code refactoring, for example, take out a 'switch case' for 'messageText' in a 'index.ts' file. Find more places for refactor.
## TODO: ICTB-46 Fix error logging (JSON.stringify circular structure). Create a helper to limit 2 levels of nested objects when logging.

##### 03/01/2026

## TODO: ICTB-36 add Trello as a task tracking system (realize what account we can use for it)

~~## TODO: ICTB-37 Fix error "Unhandled rejection Error: ETELEGRAM: 400 Bad Request: chat not found" for developer mode (npm run dev with '@IntervalCardsDevBot' bot)~~

~~## TODO: ICTB-38 add documentations (/docs folder) for project setup and usage: (arch-rules.md, architecture.md, requirements.md) + AGENTS.md (medium priority)~~

##### 14/07/2025

## ~~TODO: ICTB-35 added possible to resume all start learning users~~

##### 06/07/2025

~~TODO: ICTB-34 Add user interval to users AWS table~~

~~TODO: ICTB-33 Create interface for users data in users AWS table~~

---

##### 03/01/2025

~~TODO: ICTB-31 fix bug when user can't add theirs words. (duplicate issue). Probably app don't ckeck words from DB by
userID.~~
~~TODO: ICTB-32 Sort alphabetically for outputting and removing words~~

---

##### 10/17/2024

TODO: ICTB-30 check add word for code injection (threat check)

---

##### 10/6/2024

TODO: ICTB-29 'Finish and continue learning' button (when we add word)

---

##### 10/1/2024

~~TODO: ICTB-26 open user menu after user add new word (✅ The word ... with translation ... has been added. You can add more!)~~

~~TODO: ICTB-27 add thanslations to 'Show all words'~~
~~TODO: ICTB-28 ICTB-25 check if new words appears after adding new words and start learn again (Start learn → stop learn → add words → start learn)~~

---

##### 9/27/2024

~~TODO: ICTB-25 bugfix user run multiple schedules (when start other one more schedule — other schedule for that user
should be stopped)~~

---

##### 9/24/2024

~~TODO: ICTB-24 add logo to bot~~

~~TODO: ICTB-23 fix return message when user add word with translation. And test brakeline separator~~

---

##### 9/23/2024

~~TODO: ICTB-22 make ideal regExp for escaping Characters such as '!'... e.t.c. (src\services\schedule-service.ts
→ startLearnByUserId())~~

~~TODO: ICTB-21 add translation of user's word wia separator ('--' OR '/' OR 'brake line (\n)')~~

~~TODO: ICTB-18 add task stack in `tasksTrackingSystem.md` (separate block for current tasks)~~

---

##### 9/21/2024

~~TODO: ICTB-20 Change DataBase to DynamoDB~~

---

##### 2/11/2024

~~TODO: ICTB-5 check node:20-slim~~

~~TODO: ICTB-7 .env for dev & for prod. Add schedule for dev '_/10 9-21 _ \* _' + for prod '0 9-21 _ \* \*'~~

~~TODO: ICTB-6 cut-off version v1.0.0~~

---

##### 2/9/2024

TODO: ICTB-8 add Standard words set #1 (the 30 common usefully words from 3 letters. Ask ChatGPT)

---

##### 2/4/2024

TODO: ICTB-10 Implement translation

TODO: ICTB-13 add button to check user status (user mode)

TODO: ICTB-17 add logging. - Ask ChatGPT and analyze where to display logs and which option is best.

~~TODO: ICTB-3 make deleting operations by inline keyboard~~

~~TODO: ICTB-4 make schedule from 9:00 till 21:00~~

~~TODO: ICTB-5 cut-off version v1.0.0~~

~~TODO: ICTB-11 add left bottom menu~~

~~TODO: ICTB-12 add instruction '/instruction'~~

---

##### 01/30/2024

~~TODO: change in interface~~

~~TODO: Multiple deleting issue~~

---

##### 01/29/2024

~~TODO: redo users dictionary with object ({id: 123, word: ...})~~

~~TODO: make schedule from 9:00 till 21:00~~

~~TODO: make deleting operations by inline keyboard~~

---

##### 01/28/2024

~~TODO: check working of MessageService~~

~~TODO: delete unused keyboard options... And other that can be~~

~~TODO: on pressing 'Cancel' or other word — bot add word 'Cancel'~~

~~TODO: test the bot~~

---

##### 01/14/2023

~~TODO: redo inline keyboard to reply keyboard~~

~~TODO: redo all read / write file to read/writeFileSync~~

~~TODO: make 3 methods: remove word / start learning, stop learning~~

~~TODO: delete duplicates of words~~

~~TODO: set-up node-typescript to make possible to debug~~

---

##### 01/7/2023

~~TODO: redo all read / write file to read/writeFileSync~~

~~TODO: move findUserMethod to separate method~~

~~TODO: redo inline keyboard to reply keaboard~~

~~TODO: implement the 'scheduleJob'~~
` schedule.scheduleJob('13 * * * *', () => {
         bot.sendMessage(chatId, 'Hello! This is a scheduled message.');
     });`

---

##### 12/30/2023

~~TODO: investigate usage info: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md~~

~~TODO: investigate API: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/api.md~~

~~TODO:investigate help from repository's package: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/help.md~~

~~TODO: redo bot for webhooks: https://github.com/yagop/node-telegram-bot-api/tree/master/examples/webhook~~

~~TODO: send message by time~~
