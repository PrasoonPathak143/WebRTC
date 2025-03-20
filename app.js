const express = require('express');
const app = express();
const socketio = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const path = require('path');

const io = socketio(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'public')));

io.on('connection', (socket) => {
  console.log('Client connected');
});

app.get('/', (req, res) => {
  res.render("index");
});

server.listen(3000);