// index.js
require('dotenv').config(); // .env file support
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2'); // MySQL connection
const app = express();

// ===== CORS setup =====
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // frontend URL
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== Body parsers =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Database connection =====
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'vehicle_repair'
});

db.connect(err => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected!');
  }
});

// ===== Routes =====
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicle');
const repairRoutes = require('./routes/repairs');

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/repairs', repairRoutes);

// ===== /api status route for frontend connectivity check =====
app.get('/api', (req, res) => {
  res.json({ message: '✅ API is reachable' });
});

// ===== Root route =====
app.get('/', (req, res) => {
  res.json({ message: '✅ Vehicle Repair System API (DB-backed) is running!' });
});

// ===== Global error handler =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ===== Start server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port ${PORT}`);
});

// ===== Export db for use in routes =====
module.exports = db;