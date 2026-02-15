# IntervalCardsTelegramBot
Here is my PET project for bot, that will send cards with intervals


Instruction links. that is bot's code from: [[Medium] Creating a Simple Telegram Bot using Node.js: A Step-by-Step Guide](https://medium.com/@gabriel.dadamosrossetto/creating-a-simple-telegram-bot-using-node-js-a-step-by-step-guide-b476447955c6).

### How to run:
* copy `.env.example` to `.env` in same folder
* Ask an appropriate telegram bot token specially to this bot. Paste the token to `TELEGRAM_BOT_TOKEN` variable in `.env` file
* run `node index.ts` (Terminal should turn into waiting mode).

    `npm start` / `npm run dev` — run development mode (bot sends message every *x* seconds)
    
    `npm prod dev` — run production mode (bot sends message every hour or so)
* open the [**IntervalCardsBot**](https://t.me/IntervalCardsBot) from telegram
* press "*Start*" button or type `/start`.
* bot should return a message

### LINKS: 
* usage info: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md
* API: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/api.md
* help: https://github.com/yagop/node-telegram-bot-api/blob/master/doc/help.md
* webhooks: https://github.com/yagop/node-telegram-bot-api/tree/master/examples/webhook
* formatting options: https://core.telegram.org/bots/api#formatting-options


####Versioning

[Versioning in Git Best Practices](https://chatgpt.com/share/66f1811e-b13c-8013-ae28-bc46f7b54415)

```shell script
# Start with the develop branch
git checkout develop

# Create a release branch for version 1.0.0
git checkout -b release/1.0.0

# Make all changes ...

# After final changes are made and tested, merge the release branch into main
git checkout main
git merge --no-ff release/1.0.0

# Tag the release version
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push the changes and tag
git push origin main
git push origin v1.0.0

# Merge the release branch back into develop to keep it up to date
git checkout develop
git merge --no-ff release/1.0.0

# Delete the release branch
git branch -d release/1.0.0

```


### NUANCES

#### LLM

* For some models in OpenRouter API Reasoning is mandatory for this endpoint and cannot be disabled