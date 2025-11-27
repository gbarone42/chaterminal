# CLI ChatGPT (chaterminal)

Un semplice chatbot da linea di comando che usa l'API di OpenAI (modelli GPT) per conversazioni interattive.

## Prerequisiti

- Node.js >= 18
- Una variabile d'ambiente `OPENAI_API_KEY` configurata con la tua chiave OpenAI

## Installazione

```bash
npm install
```

## Avvio

Assicurati di avere la chiave impostata nel tuo ambiente:

```bash
export OPENAI_API_KEY=la_tua_chiave
```

Poi avvia il chatbot CLI:

```bash
npm run chat
```

In alternativa, puoi eseguire direttamente il file:

```bash
node src/cli-chat.js
```

## Utilizzo

- Scrivi un messaggio e premi Invio per inviarlo
- Digita `exit` per terminare la chat
- La sessione mantiene il contesto della conversazione
- Le risposte vengono mostrate in tempo reale

## Note

- Questo progetto usa il pacchetto `openai` e `readline-sync`
- Se vedi un avviso di deprecazione di `punycode`, è innocuo per l'esecuzione

---

## Bot Telegram

Puoi usare lo stesso motore per un bot Telegram che risponde alle tue domande.

### Variabili d'ambiente

- `OPENAI_API_KEY`: la tua chiave OpenAI
- `TELEGRAM_BOT_TOKEN`: il token del bot Telegram (ottienilo da @BotFather)

### Avvio del bot

```bash
export OPENAI_API_KEY=la_tua_chiave
export TELEGRAM_BOT_TOKEN=il_tuo_token
npm run telegram
```

Il bot parte in modalità polling. Scrivi al tuo bot su Telegram.

### Comandi supportati

- `/start`: avvia una nuova sessione
- `/reset`: cancella il contesto della chat corrente

Ogni chat (chatId) mantiene il proprio contesto separato.
