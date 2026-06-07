require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const db = require('./configs/db');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = require('./configs/socket')(server);

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CaroOnline Backend is running' });
});

// Thêm route mặc định để khi truy cập link gốc không bị báo lỗi "Cannot GET /"
app.get('/', (req, res) => {
  res.send('<h1>CaroOnline Backend is successfully running! 🚀</h1><p>API is listening at /api</p>');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/game', require('./routes/gameRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
// app.use('/api/rooms', require('./routes/roomRoutes'));
// app.use('/api/matches', require('./routes/matchRoutes'));

// Global Error Handler
// app.use(require('./middleware/errorMiddleware'));

const PORT = process.env.PORT || 5000;

const fs = require('fs');
const path = require('path');

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    const res = await db.query('SELECT NOW()');
    console.log('Database connected successfully:', res.rows[0].now);
    
    // Tự động đọc và chạy file schema.sql để tạo bảng nếu chưa có
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schema);
    console.log('Database schema synchronized successfully (tables created/verified).');

  } catch (err) {
    console.error('Database connection or initialization failed:', err);
  }
});
