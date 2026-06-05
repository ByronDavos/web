const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path'); // ΜΟΝΟ μία φορά
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/* PATCH: dynamic CORS */
const allowedOrigins = (process.env.ALLOWED_ORIGIN || process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5500,http://localhost:5500')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps or curl / local file://)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: false,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
}));
app.options('*', cors()); // enable pre-flight for all routes


// rate limit για login
const authLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 50 });
app.use('/api/auth', authLimiter);

// static uploads με caching
const staticTTL = Number(process.env.STATIC_TTL || 604800);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => res.set('Cache-Control', `public, max-age=${staticTTL}`)
}));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/theses', require('./routes/theses'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/files', require('./routes/files'));
app.use('/api/import', require('./routes/import'));
app.use('/api/stats', require('./routes/stats'));
app.use('/feed', require('./routes/feed')); // δημόσιο

 // === Socket.IO setup (HTTP server + WS) ===
 const server = http.createServer(app);
 const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, cb) => {
      // επέτρεψε file:// και null origins (τοπικά html)
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by WS CORS: ' + origin));
    },
    credentials: true
  }
});

 // κάνε export για να το χρησιμοποιούν οι controllers: require('../app').io
 module.exports.io = io;

 // WebSocket auth: περιμένουμε JWT στο handshake (client: io(API_BASE, { auth:{ token } }))
 io.on('connection', (socket) => {
   const { token } = socket.handshake.auth || {};
   try {
     const payload = jwt.verify(token, process.env.JWT_SECRET);
     socket.join(`user:${payload.id}`);   // προσωπικό room
     socket.data.userId = payload.id;
   } catch (err) {
     return socket.disconnect(true);
 }
});
// ✅ WebSocket auth middleware: verify JWT πριν την σύνδεση
io.use((socket, next) => {
  const { token } = socket.handshake.auth || {};
  if (!token) return next(new Error('No token provided'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user = { id: payload.id, role: payload.role, email: payload.email };
    return next();
  } catch (err) {
    return next(new Error('Invalid token'));
  }
});

// ✅ Αν ο έλεγχος περάσει, βάλε το socket στο προσωπικό room
io.on('connection', (socket) => {
  const u = socket.data.user;
  if (!u?.id) return socket.disconnect(true);
  socket.join(`user:${u.id}`);
  console.log(`WS connected: user ${u.id} (${u.role || 'n/a'})`);
});
// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ HTTP + WS at http://localhost:${PORT}`));

 // αν κάπου αλλού χρειαστείς το app
 module.exports.app = app;