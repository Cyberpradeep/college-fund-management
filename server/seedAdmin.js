const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const exists = await User.findOne({ email: 'admin@college.com' });
  if (!exists) {
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Super Admin',
      email: 'admin@college.com',
      password: hashed,
      role: 'admin'
    });
    console.log('✅ Admin created');
  } else {
    console.log('⚠️ Admin already exists');
  }
  mongoose.disconnect();
});
