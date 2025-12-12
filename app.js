const express = require('express');
const path = require('path');
const app = express();

app.set('trust proxy', true);  // Muy importante para confiar en proxy (NGINX)

const PORT = process.env.PORT || 7895;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

