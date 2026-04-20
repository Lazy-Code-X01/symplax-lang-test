const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('ok');
});

// Intentional crash — reference error on startup
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  thisVariableDoesNotExist; // ReferenceError: crashes immediately after binding
});
