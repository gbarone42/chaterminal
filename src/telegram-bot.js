#!/usr/bin/env node
import OpenAI from 'openai';
import TelegramBot from 'node-telegram-bot-api';

// Environment variables
const apiKey = process.env.OPENAI_API_KEY;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

if (!apiKey) {
  console.error('\nErrore: variabile OPENAI_API_KEY non impostata.');
  console.error('Imposta la chiave: export OPENAI_API_KEY=la_tua_chiave\n');
  process.exit(1);
}

if (!telegramToken) {
  console.error('\nErrore: variabile TELEGRAM_BOT_TOKEN non impostata.');
  console.error('Imposta il token Telegram: export TELEGRAM_BOT_TOKEN=il_tuo_token\n');
  process.exit(1);
}

// OpenAI client
const openai = new OpenAI({ apiKey });

// Telegram bot (inizializzazione senza polling; abilitiamo dopo i check)
const bot = new TelegramBot(telegramToken, { polling: false });

(async () => {
  try {
    // Verifica token e info bot
    const me = await bot.getMe();

    // Assicura che non ci sia un webhook attivo (in conflitto col polling)
    try {
      await bot.deleteWebHook();
    } catch {}

    // Avvia polling esplicitamente
    bot.startPolling();
    console.log(`Telegram bot avviato come @${me.username}. Invia un messaggio al tuo bot per iniziare.`);
  } catch (err) {
    console.error('Errore nell\'inizializzazione del bot:', err?.response?.body || err?.message || err);
    console.error('Suggerimenti:');
    console.error('- Controlla che TELEGRAM_BOT_TOKEN sia corretto e senza virgolette o spazi extra.');
    console.error('- Se il token è stato revocato, rigeneralo con @BotFather e riesporta la variabile.');
    process.exit(1);
  }
})();

// Per mantenere contesti per chat diverse, usiamo una mappa chatId -> messaggi
const conversations = new Map();

function getConversation(chatId) {
  if (!conversations.has(chatId)) {
    conversations.set(chatId, [
      { role: 'system', content: 'Sei un assistente utile. Rispondi in modo chiaro e conciso.' }
    ]);
  }
  return conversations.get(chatId);
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (!text) {
    return bot.sendMessage(chatId, 'Per favore, invia un messaggio di testo.');
  }

  // Comandi rapidi
  if (text.toLowerCase() === '/start') {
    conversations.delete(chatId);
    return bot.sendMessage(chatId, 'Ciao! Inviami una domanda. Digita /reset per cancellare il contesto.');
  }
  if (text.toLowerCase() === '/reset') {
    conversations.delete(chatId);
    return bot.sendMessage(chatId, 'Contesto cancellato. Inviami una nuova domanda.');
  }

  const messages = getConversation(chatId);
  messages.push({ role: 'user', content: text });

  try {
    // Usa completions con streaming disabilitato per semplicità su Telegram
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || 'Nessuna risposta.';
    messages.push({ role: 'assistant', content: answer });
    await bot.sendMessage(chatId, answer, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Errore OpenAI:', error?.message || error);
    messages.pop();
    await bot.sendMessage(chatId, 'Si è verificato un errore nel generare la risposta.');
  }
});
