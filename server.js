const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const deptRoutes = require('./routes/departmentRoutes');
const txRoutes = require('./routes/transactionRoutes');
const reportRoutes = require('./routes/reportRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', deptRoutes);
app.use('/api/transactions', txRoutes);
app.use('/api/reports', reportRoutes); 
// Mongo Connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
  app.listen(process.env.PORT, () => console.log(`🚀 Server running on ${process.env.PORT}`));
}).catch(err => console.error('❌ MongoDB connection failed:', err));
