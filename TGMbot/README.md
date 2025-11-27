# 🎭 Undercover - Telegram Bot Game

Bot Telegram per giocare a **Undercover**, un gioco sociale di deduzione e bluff multiplayer.

## 🎮 Come si gioca

Undercover è un gioco di ruolo sociale che si svolge interamente in Telegram:

- **Giocatori**: 3+ persone in un gruppo Telegram
- **Ruoli**: Civili, Undercover, Mr. White
- **Obiettivo**: Scopri gli infiltrati o inganna tutti!

### Ruoli

- 👥 **Civili** (maggioranza): ricevono la stessa parola
- 🎭 **Undercover** (minoranza): ricevono una parola simile per confondere
- 🎩 **Mr. White** (1 solo): non riceve nessuna parola, deve bluffare!

### Flusso di gioco

1. Il **superuser** crea una partita nel gruppo con `/newgame`
2. Ogni giocatore si unisce in **chat privata** con il bot usando `/join`
3. Il superuser avvia con `/startgame` - ogni giocatore riceve ruolo e parola in privato
4. **Fase discussione**: parlate e cercate di capire chi è chi!
5. Il superuser termina il round con `/endround`
6. **Votazione**: ogni giocatore vota in privato chi eliminare
7. Il più votato viene eliminato e il gioco continua
8. Si ripete fino a una condizione di vittoria

### Condizioni di vittoria

- 🏆 **Civili vincono**: se eliminano tutti gli Undercover e Mr. White
- 🏆 **Undercover vincono**: se eliminano tutti i Civili
- 🏆 **Mr. White vince**: se sopravvive e confonde tutti

## 🚀 Avvio rapido

```bash
cd TGMbot
npm install
npm run dev  # sviluppo
# oppure
npm run build && npm run start  # produzione
```

**Variabili d'ambiente richieste** (file `.env`):
```env
TELEGRAM_BOT_TOKEN_BOB=your_telegram_bot_token
OPENAI_API_KEY=your_openai_key  # opzionale
```

## 📋 Comandi disponibili

**Nel gruppo:**
- `/newgame` - Crea una nuova partita (superuser)
- `/startgame` - Avvia il gioco (superuser)
- `/endround` - Termina round e avvia votazione (superuser)
- `/status` - Mostra stato partita
- `/stop` - Ferma la partita (superuser)

**In chat privata:**
- `/start` - Benvenuto e istruzioni
- `/join` - Unisciti alla partita
- `/help` - Mostra comandi

## 📁 Struttura progetto

```
src/
├── types/
│   └── game.ts           # Interfacce TypeScript del gioco
├── game/
│   ├── manager.ts        # Logica gestione partite
│   └── words.ts          # Coppie di parole per il gioco
├── bot/
│   ├── index.ts          # Entry point bot
│   └── commands/
│       └── game.ts       # Comandi Telegram
├── config/
│   ├── env.ts            # Configurazione environment
│   └── logger.ts         # Logger (Pino)
└── index.ts              # Entry point applicazione
```

## 🧪 Testing

```bash
npm test
```

## 🐳 Docker

```bash
docker-compose up --build
```

## 📝 Note

- Minimo 3 giocatori per iniziare
- Il superuser gestisce il flusso (start/endround)
- Ogni giocatore deve avere una chat privata attiva con il bot
- Le votazioni avvengono tramite pulsanti inline in privato
