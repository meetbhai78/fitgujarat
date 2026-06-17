const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gujarat_stepcount';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (uri !== 'mongodb://localhost:27017/gujarat_stepcount') {
      console.log('🔄 Falling back to local MongoDB...');
      try {
        const conn = await mongoose.connect('mongodb://localhost:27017/gujarat_stepcount');
        console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
      } catch (localError) {
        console.error(`❌ Local MongoDB Connection Error: ${localError.message}`);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
