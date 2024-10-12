
###CURRENT WORK:

```
TODO: ICTB-5 check node:20-slim
TODO: ICTB-10 Implement translation
TODO: ICTB-13 add button to check user status (user mode)
TODO: ICTB-17 add logging
TODO: ICTB-24 add logo to bot
TODO: ICTB-29 'Finish and continue learning' button (when we add word)
```

---
##### 10/6/2024
TODO: ICTB-29 'Finish and continue learning' button (when we add word)

---
##### 10/1/2024
~~TODO: ICTB-26 open user menu after user add new word (✅ The word  ... with translation ... has been added. You can add more!)~~

~~TODO: ICTB-27 add thanslations to 'Show all words'~~
~~TODO: ICTB-28 ICTB-25 check if new words appears after adding new words and start learn again (Start learn → stop learn → add words → start learn)~~
---
##### 9/27/2024
~~TODO: ICTB-25 bugfix user run multiple schedules (when start other one more schedule — other schedule for that user
 should be stopped)~~

---
##### 9/24/2024
TODO: ICTB-24 add logo to bot

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
TODO: ICTB-5 check node:20-slim

~~TODO: ICTB-7 .env for dev & for prod. Add schedule for dev '*/10 9-21 * * *' + for prod '0 9-21 * * *'~~

~~TODO: ICTB-6 cut-off version v1.0.0~~

---
##### 2/9/2024
TODO: ICTB-8 add Standard words set #1 (the 30 common usefully words from 3 letters. Ask ChatGPT)

---
##### 2/4/2024
TODO: ICTB-10 Implement translation

TODO: ICTB-13 add button to check user status (user mode)

TODO: ICTB-17 add logging


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
    ```
     schedule.scheduleJob('13 * * * *', () => {
         bot.sendMessage(chatId, 'Hello! This is a scheduled message.');
     });
    ```

---
##### 12/30/2023
    
~~TODO: investigate usage info: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md~~

~~TODO: investigate API: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/api.md~~

~~TODO:investigate help from repository's package: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/help.md~~

~~TODO: redo bot for webhooks: https://github.com/yagop/node-telegram-bot-api/tree/master/examples/webhook~~

~~TODO: send message by time~~
