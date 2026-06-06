const { Server } = require('socket.io');

const rooms = new Map(); // Store rooms in memory

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_lobby', () => {
      socket.join('lobby');
      io.to('lobby').emit('room_list_update', Array.from(rooms.values()));
    });

    socket.on('create_room', (data) => {
      const { roomId, user } = data;
      const newRoom = {
        id: roomId,
        players: [user],
        board: Array(15).fill(null).map(() => Array(15).fill(null)),
        turn: user.username, // first player goes first
        status: 'waiting', // 'waiting', 'playing', 'finished'
        messages: [],
        winningCells: null,
        turnStartedAt: null,
      };
      rooms.set(roomId, newRoom);
      
      socket.join(roomId);
      io.to('lobby').emit('room_list_update', Array.from(rooms.values()));
      socket.emit('room_state_update', newRoom);
    });

    socket.on('join_room', (data) => {
      const { roomId, user } = data;
      const room = rooms.get(roomId);
      
      if (room) {
        const isPlayerAlreadyInRoom = room.players.some(p => p.username === user.username);
        
        if (!isPlayerAlreadyInRoom && room.players.length < 2) {
          room.players.push(user);
          if (room.players.length === 2) {
            room.status = 'playing';
          }
        }
        
        socket.join(roomId);
        io.to(roomId).emit('room_state_update', room);
        io.to('lobby').emit('room_list_update', Array.from(rooms.values()));
      }
    });

    socket.on('send_message', (data) => {
      const { roomId, user, text } = data;
      const room = rooms.get(roomId);
      if (room) {
        const message = { user: user.username, text, time: new Date().toISOString() };
        room.messages.push(message);
        io.to(roomId).emit('receive_message', message);
      }
    });

    socket.on('make_move', (data) => {
      const { roomId, row, col, user } = data;
      const room = rooms.get(roomId);
      
      if (room && room.status === 'playing') {
        if (room.turn !== user.username) return; // Not their turn
        if (room.board[row][col] !== null) return; // Cell already taken

        const isPlayer1 = room.players[0].username === user.username;
        const symbol = isPlayer1 ? 'X' : 'O';
        
        room.board[row][col] = symbol;
        const opponent = room.players.find(p => p.username !== user.username);
        room.turn = opponent ? opponent.username : room.turn;
        
        io.to(roomId).emit('room_state_update', room);
      }
    });
    
    socket.on('game_over', (data) => {
       const { roomId, winner } = data;
       const room = rooms.get(roomId);
       if (room) {
           room.status = 'finished';
           room.winner = winner;
           io.to(roomId).emit('room_state_update', room);
       }
    });

    socket.on('leave_room', (data) => {
      const { roomId, user } = data;
      socket.leave(roomId);
      const room = rooms.get(roomId);
      if (room) {
        room.players = room.players.filter(p => p.username !== user.username);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          room.status = 'waiting';
          io.to(roomId).emit('room_state_update', room);
        }
        io.to('lobby').emit('room_list_update', Array.from(rooms.values()));
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // A more robust implementation would track socket.id to user mapping
      // and remove them from rooms on disconnect.
    });
  });

  return io;
};
