// Step 3: Esempio git MCP (pseudo-cmd)
// src/git-status.js
const { exec } = require('child_process');

exec('git status', (err, stdout, stderr) => {
  if (err) {
    console.error(stderr);
    return;
  }
  console.log(stdout);
});
