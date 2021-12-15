const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const { generateMessage } = require('./utils/messages');
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
  console.log('new websocket connection');

  socket.emit('message', generateMessage('Admin', 'Welcome'));

  socket.broadcast.emit(
    'message',
    generateMessage('Admin', 'a new user has joined')
  );

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }
    socket.join(user.room);

    socket.emit('message', generateMessage('Welcome'));
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage(`${user.username} has joined`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      user: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', generateMessage(message));
    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin', `${user.username} has left`)
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        user: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`server is up on port ${port}`);
});
