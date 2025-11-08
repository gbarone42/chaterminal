// Step 3: Esempio fetch MCP (pseudo-cmd)
// src/fetch-doc.js
const fetch = require('node-fetch');

async function fetchExpressDocs() {
  const res = await fetch('https://expressjs.com/en/starter/hello-world.html');
  const text = await res.text();
  return text.slice(0, 500) + '...'; // Mostra solo i primi 500 caratteri
}

fetchExpressDocs().then(console.log);
