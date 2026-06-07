const { Server } = require('socket.io');
const User = require('../models/User');
const MatchHistory = require('../models/MatchHistory');


// ── In-memory stores ──────────────────────────────────────────
const rooms = new Map();           // roomId → roomObject
const socketToUser = new Map();    // socketId → { username, roomId, userId }

const BOARD_SIZE = 15;

// ── Helper: Server-side win check (5-in-a-row) ───────────────
/**
 * Kiểm tra thắng tại ô (row, col) cho symbol nhất định.
 * @param {Array[][]} board
 * @param {number} row
 * @param {number} col
 * @param {string} symbol - 'X' hoặc 'O'
 * @returns {Array<[number,number]>|null} Mảng ô thắng hoặc null
 */
function checkWinnerServer(board, row, col, symbol) {
  const directions = [
    [[0, 1],  [0, -1] ],
    [[1, 0],  [-1, 0] ],
    [[1, 1],  [-1, -1]],
    [[1, -1], [-1, 1] ]
  ];

  for (const dir of directions) {
    const cells = [[row, col]];
    for (let i = 0; i < 2; i++) {
      let r = row + dir[i][0];
      let c = col + dir[i][1];
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === symbol) {
        cells.push([r, c]);
        r += dir[i][0];
        c += dir[i][1];
      }
    }
    if (cells.length >= 5) return cells;
  }
  return null;
}

// ── Helper: publicRooms — chỉ emit dữ liệu cần thiết cho Lobby ─
function publicRooms() {
  return Array.from(rooms.values()).map(r => ({
    id: r.id,
    players: r.players.map(p => ({ username: p.username, elo: p.elo })),
    status: r.status,
    hostElo: r.players[0]?.elo ?? 1200,
    createdAt: r.createdAt,
    hasPassword: !!r.password,
    spectatorCount: r.spectators ? r.spectators.length : 0,
  }));
}

// ── Helper: removePlayerFromRoom ──────────────────────────────
async function removePlayerFromRoom(io, socketId) {
  const info = socketToUser.get(socketId);
  if (!info) return;
  const { username, roomId } = info;
  const room = rooms.get(roomId);
  if (!room) { socketToUser.delete(socketId); return; }

  room.players = room.players.filter(p => p.username !== username);
  room.spectators = (room.spectators || []).filter(s => s.username !== username);

  if (room.players.length === 0 && (room.spectators || []).length === 0) {
    rooms.delete(roomId);
  } else {
    // Nếu đang chơi mà một người rời → người còn lại thắng
    if (room.status === 'playing' && room.players.length < 2) {
      const winner = room.players[0];
      if (winner) {
        room.status = 'finished';
        room.winner = winner.username;
        room.disconnectWin = true;
        // Cập nhật Elo
        try {
          const winnerData = room.playerData?.find(p => p.username === winner.username);
          const loserData  = room.playerData?.find(p => p.username === username);
          if (winnerData && loserData) {
            const { calculateEloServer } = require('./eloHelper');
            const newWinnerElo = calculateEloServer(winnerData.elo, loserData.elo, 1);
            const newLoserElo  = calculateEloServer(loserData.elo, winnerData.elo, 0);
            await User.updateEloAndStats(winnerData.id, newWinnerElo, true);
            await User.updateEloAndStats(loserData.id, newLoserElo, false);
            room.eloChanges = {
              [winner.username]: newWinnerElo - winnerData.elo,
              [username]: newLoserElo - loserData.elo,
            };
          }
        } catch (e) { console.error('Elo update on disconnect error:', e); }
      }
    } else if (room.status === 'playing' && room.players.length === 1) {
      room.status = 'waiting';
    }
    io.to(roomId).emit('room_state_update', room);
  }

  socketToUser.delete(socketId);
  io.to('lobby').emit('room_list_update', publicRooms());
  io.emit('online_count', io.engine.clientsCount);
}

// ── Main export ───────────────────────────────────────────────
module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Phát số người online sau khi ai đó kết nối
    io.emit('online_count', io.engine.clientsCount);

    // ── Lobby ──────────────────────────────────────────────────
    socket.on('join_lobby', (data) => {
      socket.join('lobby');
      // Lưu userId nếu user đã đăng nhập
      if (data?.userId) {
        const existing = socketToUser.get(socket.id) || {};
        socketToUser.set(socket.id, { ...existing, userId: data.userId, username: data.username });
      }
      socket.emit('room_list_update', publicRooms());
      socket.emit('online_count', io.engine.clientsCount);
    });

    // ── Create Room ────────────────────────────────────────────
    socket.on('create_room', (data) => {
      const { roomId, user, password } = data;

      // Nếu phòng đã tồn tại → từ chối
      if (rooms.has(roomId)) {
        socket.emit('create_room_error', 'Tên phòng đã tồn tại. Vui lòng chọn tên khác.');
        return;
      }

      const newRoom = {
        id: roomId,
        players: [user],
        spectators: [],
        board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
        turn: user.username,
        status: 'waiting',
        messages: [],
        winningCells: null,
        turnStartedAt: null,
        createdAt: Date.now(),
        password: password || null,
        eloChanges: {},
        playerData: [{ username: user.username, elo: user.elo, id: user.id }],
        rematchRequests: [],
        moves: [],
      };

      rooms.set(roomId, newRoom);
      socketToUser.set(socket.id, { username: user.username, roomId, userId: user.id });

      socket.join(roomId);
      socket.leave('lobby');
      io.to('lobby').emit('room_list_update', publicRooms());
      socket.emit('room_state_update', newRoom);
    });

    // ── Join Room ──────────────────────────────────────────────
    socket.on('join_room', (data) => {
      const { roomId, user, password, spectate } = data;
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit('join_room_error', 'Phòng không tồn tại.');
        return;
      }

      // Kiểm tra mật khẩu
      if (room.password && room.password !== password && !spectate) {
        socket.emit('join_room_error', 'Mật khẩu không đúng.');
        return;
      }

      const isPlayerAlreadyInRoom = room.players.some(p => p.username === user.username);

      if (spectate || (room.players.length >= 2 && !isPlayerAlreadyInRoom)) {
        // Spectator mode
        if (!room.spectators) room.spectators = [];
        const alreadySpectating = room.spectators.some(s => s.username === user.username);
        if (!alreadySpectating) room.spectators.push(user);
        socket.join(roomId);
        socketToUser.set(socket.id, { username: user.username, roomId, userId: user.id, spectating: true });
        socket.emit('room_state_update', { ...room, isSpectator: true });
        io.to('lobby').emit('room_list_update', publicRooms());
        return;
      }

      if (!isPlayerAlreadyInRoom && room.players.length < 2) {
        room.players.push(user);
        if (!room.playerData) room.playerData = [];
        room.playerData.push({ username: user.username, elo: user.elo, id: user.id });
        if (room.players.length === 2) {
          room.status = 'playing';
          room.turnStartedAt = Date.now();
          // System messages
          room.messages.push({ isSystem: true, text: `⚡ ${user.username} đã tham gia phòng!`, time: new Date().toISOString() });
          room.messages.push({ isSystem: true, text: `🎮 Ván đấu bắt đầu! ${room.players[0].username} (X) vs ${user.username} (O)`, time: new Date().toISOString() });
        } else {
          room.messages.push({ isSystem: true, text: `⚡ ${user.username} đã vào phòng. Chờ đối thủ...`, time: new Date().toISOString() });
        }
      }

      socket.join(roomId);
      socket.leave('lobby');
      socketToUser.set(socket.id, { username: user.username, roomId, userId: user.id });

      io.to(roomId).emit('room_state_update', room);
      io.to('lobby').emit('room_list_update', publicRooms());
    });

    // ── Chat ───────────────────────────────────────────────────
    socket.on('send_message', (data) => {
      const { roomId, user, text } = data;
      const room = rooms.get(roomId);
      if (room && text?.trim()) {
        const message = { user: user.username, text: text.trim(), time: new Date().toISOString() };
        room.messages.push(message);
        io.to(roomId).emit('receive_message', message);
      }
    });

    // ── Make Move ──────────────────────────────────────────────
    socket.on('make_move', async (data) => {
      const { roomId, row, col, user } = data;
      const room = rooms.get(roomId);

      if (!room || room.status !== 'playing') return;
      if (room.turn !== user.username) return;         // Không phải lượt của họ
      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
      if (room.board[row][col] !== null) return;       // Ô đã bị chiếm

      const isPlayer1 = room.players[0].username === user.username;
      const symbol = isPlayer1 ? 'X' : 'O';

      // [Sequence Step 2]: Server nhận tọa độ nước đi, cập nhật board và kiểm tra thắng 5 quân
      room.board[row][col] = symbol;
      if (!room.moves) room.moves = [];
      room.moves.push({ row, col, symbol, username: user.username, time: Date.now() });

      // ── Server-side win check ──────────────────────────────
      const winCells = checkWinnerServer(room.board, row, col, symbol);
      if (winCells) {
        room.status = 'finished';
        room.winner = user.username;
        room.winningCells = winCells;
        // System message cho kết thúc game
        room.messages.push({ isSystem: true, text: `🏆 ${user.username} chiến thắng!`, time: new Date().toISOString() });

        // [Sequence Step 3]: Tính toán điểm Elo mới cho 2 người chơi
        try {
          const winner = room.playerData?.find(p => p.username === user.username);
          const loser  = room.playerData?.find(p => p.username !== user.username);
          if (winner && loser) {
            const K = (elo) => elo < 2100 ? 32 : 16;
            const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
            const newWinnerElo = Math.max(100, Math.round(winner.elo + K(winner.elo) * (1 - expected(winner.elo, loser.elo))));
            const newLoserElo  = Math.max(100, Math.round(loser.elo  + K(loser.elo)  * (0 - expected(loser.elo,  winner.elo))));
            
            // [Sequence Step 4]: Gọi User model cập nhật Elo mới vào DB
            await User.updateEloAndStats(winner.id, newWinnerElo, true);
            await User.updateEloAndStats(loser.id,  newLoserElo,  false);
            room.eloChanges = {
              [user.username]:  newWinnerElo - winner.elo,
              [loser.username]: newLoserElo  - loser.elo,
            };
            
            // [Sequence Step 5]: Ghi thông tin ván đấu và danh sách nước đi (moves) vào lịch sử
            await MatchHistory.create({
              winnerId: winner.id,
              loserId: loser.id,
              player1Id: room.playerData[0]?.id,
              player2Id: room.playerData[1]?.id,
              winnerEloChange: newWinnerElo - winner.elo,
              loserEloChange: newLoserElo - loser.elo,
              isDraw: false,
              moves: room.moves,
              mode: 'online',
            });
            // Cập nhật elo trong playerData để rematch dùng đúng
            winner.elo = newWinnerElo;
            loser.elo  = newLoserElo;
          }
        } catch (e) { console.error('Elo update error:', e); }

        // [Sequence Step 6]: Gửi (emit) trạng thái phòng mới và kết quả Elo về cho 2 client
        io.to(roomId).emit('room_state_update', room);
        io.to('lobby').emit('room_list_update', publicRooms());
        return;
      }

      // Chuyển lượt
      const opponent = room.players.find(p => p.username !== user.username);
      room.turn = opponent ? opponent.username : room.turn;
      room.turnStartedAt = Date.now();

      io.to(roomId).emit('room_state_update', room);
    });

    // ── Resign (Đầu hàng) ───────────────────────────────────────
    socket.on('resign', async (data) => {
      const { roomId, username } = data;
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;

      const opponent = room.players.find(p => p.username !== username);
      if (!opponent) return;

      room.status = 'finished';
      room.winner = opponent.username;
      room.resignLoser = username;
      room.messages.push({ isSystem: true, text: `🏳️ ${username} đã đầu hàng!`, time: new Date().toISOString() });

      // Cập nhật Elo
      try {
        const winnerData = room.playerData?.find(p => p.username === opponent.username);
        const loserData  = room.playerData?.find(p => p.username === username);
        if (winnerData && loserData) {
          const K = (elo) => elo < 2100 ? 32 : 16;
          const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
          const newWE = Math.max(100, Math.round(winnerData.elo + K(winnerData.elo) * (1 - expected(winnerData.elo, loserData.elo))));
          const newLE = Math.max(100, Math.round(loserData.elo  + K(loserData.elo)  * (0 - expected(loserData.elo, winnerData.elo))));
          await User.updateEloAndStats(winnerData.id, newWE, true);
          await User.updateEloAndStats(loserData.id,  newLE, false);
          room.eloChanges = {
            [opponent.username]: newWE - winnerData.elo,
            [username]: newLE - loserData.elo,
          };
          // Ghi lịch sử trận đấu (resign)
          await MatchHistory.create({
            winnerId: winnerData.id,
            loserId: loserData.id,
            player1Id: room.playerData[0]?.id,
            player2Id: room.playerData[1]?.id,
            winnerEloChange: newWE - winnerData.elo,
            loserEloChange: newLE - loserData.elo,
            isDraw: false,
            moves: room.moves,
            mode: 'online',
          });
          winnerData.elo = newWE;
          loserData.elo = newLE;
        }
      } catch (e) { console.error('Resign elo update error:', e); }

      io.to(roomId).emit('room_state_update', room);
      io.to('lobby').emit('room_list_update', publicRooms());
    });

    // ── Timeout (client báo hết giờ) ──────────────────────────
    socket.on('player_timeout', async (data) => {
      const { roomId, username } = data;
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;
      if (room.turn !== username) return; // Chỉ chấp nhận timeout của người đang đi

      const opponent = room.players.find(p => p.username !== username);
      if (!opponent) return;

      room.status = 'finished';
      room.winner = opponent.username;
      room.timeoutLoser = username;
      room.messages.push({ isSystem: true, text: `⏰ ${username} đã hết thời gian lượt đi!`, time: new Date().toISOString() });

      // Cập nhật Elo
      try {
        const winnerData = room.playerData?.find(p => p.username === opponent.username);
        const loserData  = room.playerData?.find(p => p.username === username);
        if (winnerData && loserData) {
          const K = (elo) => elo < 2100 ? 32 : 16;
          const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
          const newWE = Math.max(100, Math.round(winnerData.elo + K(winnerData.elo) * (1 - expected(winnerData.elo, loserData.elo))));
          const newLE = Math.max(100, Math.round(loserData.elo  + K(loserData.elo)  * (0 - expected(loserData.elo, winnerData.elo))));
          await User.updateEloAndStats(winnerData.id, newWE, true);
          await User.updateEloAndStats(loserData.id,  newLE, false);
          room.eloChanges = {
            [opponent.username]: newWE - winnerData.elo,
            [username]: newLE - loserData.elo,
          };
          // Ghi lịch sử trận đấu (timeout)
          await MatchHistory.create({
            winnerId: winnerData.id,
            loserId: loserData.id,
            player1Id: room.playerData[0]?.id,
            player2Id: room.playerData[1]?.id,
            winnerEloChange: newWE - winnerData.elo,
            loserEloChange: newLE - loserData.elo,
            isDraw: false,
            moves: room.moves,
            mode: 'online',
          });
          winnerData.elo = newWE;
          loserData.elo = newLE;
        }
      } catch (e) { console.error('Timeout elo update error:', e); }

      io.to(roomId).emit('room_state_update', room);
      io.to('lobby').emit('room_list_update', publicRooms());
    });

    // ── Offer Draw (Xin hòa) ──────────────────────────────────
    socket.on('offer_draw', (data) => {
      const { roomId, username } = data;
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;

      const opponent = room.players.find(p => p.username !== username);
      if (!opponent) return;

      // Tìm socketId của đối thủ để gửi draw_offered
      for (const [sid, info] of socketToUser.entries()) {
        if (info.username === opponent.username && info.roomId === roomId) {
          io.to(sid).emit('draw_offered', { sender: username });
          break;
        }
      }
    });

    socket.on('draw_response', async (data) => {
      const { roomId, username, accepted } = data;
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;

      const opponent = room.players.find(p => p.username !== username);
      if (!opponent) return;

      if (accepted) {
        room.status = 'finished';
        room.winner = null; // Hòa
        room.isDraw = true;
        room.messages.push({ isSystem: true, text: `🤝 Trận đấu kết thúc hòa do đồng thuận!`, time: new Date().toISOString() });

        // Tính Elo hòa
        try {
          const p1 = room.playerData?.[0];
          const p2 = room.playerData?.[1];
          if (p1 && p2) {
            const K = (elo) => elo < 2100 ? 32 : 16;
            const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
            const newElo1 = Math.max(100, Math.round(p1.elo + K(p1.elo) * (0.5 - expected(p1.elo, p2.elo))));
            const newElo2 = Math.max(100, Math.round(p2.elo + K(p2.elo) * (0.5 - expected(p2.elo, p1.elo))));

            await User.updateEloAndStats(p1.id, newElo1, 'draw');
            await User.updateEloAndStats(p2.id, newElo2, 'draw');

            room.eloChanges = {
              [p1.username]: newElo1 - p1.elo,
              [p2.username]: newElo2 - p2.elo,
            };

            // Ghi MatchHistory
            await MatchHistory.create({
              winnerId: null,
              loserId: null,
              player1Id: p1.id,
              player2Id: p2.id,
              winnerEloChange: newElo1 - p1.elo,
              loserEloChange: newElo2 - p2.elo,
              isDraw: true,
              moves: room.moves,
              mode: 'online',
            });

            p1.elo = newElo1;
            p2.elo = newElo2;
          }
        } catch (e) { console.error('Draw Elo error:', e); }

        io.to(roomId).emit('room_state_update', room);
        io.to('lobby').emit('room_list_update', publicRooms());
      } else {
        // Gửi thông báo từ chối hòa về cho đối thủ
        for (const [sid, info] of socketToUser.entries()) {
          if (info.username === opponent.username && info.roomId === roomId) {
            io.to(sid).emit('draw_declined', { decliner: username });
            break;
          }
        }
      }
    });

    // ── Rematch ────────────────────────────────────────────────
    socket.on('rematch_request', (data) => {
      const { roomId, username } = data;
      const room = rooms.get(roomId);
      if (!room || room.status !== 'finished') return;

      if (!room.rematchRequests) room.rematchRequests = [];
      if (!room.rematchRequests.includes(username)) {
        room.rematchRequests.push(username);
      }
      io.to(roomId).emit('rematch_update', { rematchRequests: room.rematchRequests });

      // Cả 2 đồng ý → reset game
      if (room.rematchRequests.length >= 2) {
        // Đổi người đi trước
        const [p1, p2] = room.players;
        room.players = [p2, p1];
        room.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        room.turn = room.players[0].username;
        room.status = 'playing';
        room.winner = null;
        room.winningCells = null;
        room.turnStartedAt = Date.now();
        room.eloChanges = {};
        room.rematchRequests = [];
        room.timeoutLoser = null;
        room.moves = [];
        room.isDraw = false;
        io.to(roomId).emit('room_state_update', room);
        io.to('lobby').emit('room_list_update', publicRooms());
      }
    });

    // ── Leave Room ─────────────────────────────────────────────
    socket.on('leave_room', async (data) => {
      const { roomId, user } = data;
      socket.leave(roomId);
      socketToUser.delete(socket.id);

      const room = rooms.get(roomId);
      if (!room) return;

      room.spectators = (room.spectators || []).filter(s => s.username !== user.username);
      room.players = room.players.filter(p => p.username !== user.username);

      if (room.players.length === 0 && (room.spectators || []).length === 0) {
        rooms.delete(roomId);
      } else {
        if (room.status === 'playing' && room.players.length < 2) {
          const winner = room.players[0];
          if (winner) {
            room.status = 'finished';
            room.winner = winner.username;
            room.disconnectWin = true;
            // Elo update khi đối thủ bỏ cuộc
            try {
              const winnerData = room.playerData?.find(p => p.username === winner.username);
              const loserData  = room.playerData?.find(p => p.username === user.username);
              if (winnerData && loserData) {
                const K = (elo) => elo < 2100 ? 32 : 16;
                const exp = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
                const newWE = Math.max(100, Math.round(winnerData.elo + K(winnerData.elo) * (1 - exp(winnerData.elo, loserData.elo))));
                const newLE = Math.max(100, Math.round(loserData.elo  + K(loserData.elo)  * (0 - exp(loserData.elo,  winnerData.elo))));
                await User.updateEloAndStats(winnerData.id, newWE, true);
                await User.updateEloAndStats(loserData.id,  newLE, false);
                room.eloChanges = { [winner.username]: newWE - winnerData.elo, [user.username]: newLE - loserData.elo };
              }
            } catch (e) { console.error('Elo on leave error:', e); }
          } else {
            room.status = 'waiting';
          }
        } else if (room.players.length < 2) {
          room.status = 'waiting';
        }
        io.to(roomId).emit('room_state_update', room);
      }

      io.to('lobby').emit('room_list_update', publicRooms());
      io.emit('online_count', io.engine.clientsCount);
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);
      await removePlayerFromRoom(io, socket.id);
      io.emit('online_count', io.engine.clientsCount);
    });
  });

  return io;
};
