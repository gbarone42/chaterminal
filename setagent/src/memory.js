// Step 2: Modulo memoria MCP (esempio base)
// src/memory.js
const memory = {};

function setMemory(key, value) {
  memory[key] = value;
}

function getMemory(key) {
  return memory[key];
}

module.exports = { setMemory, getMemory };
