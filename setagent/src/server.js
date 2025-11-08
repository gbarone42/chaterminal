// Step 1: Mini API Node/Express
// src/server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/status', (req, res) => {
  res.json({ status: 'ok', agent: 'MCP' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
