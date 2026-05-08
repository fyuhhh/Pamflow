const express = require('express');
const app = express();
const PORT = 5002;

app.get('/test', (req, res) => {
  res.send('Minimal server is working!');
});

app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});
