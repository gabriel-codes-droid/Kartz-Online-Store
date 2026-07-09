// config/db.js - Mongoose connection
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kartz';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });
  // eslint-disable-next-line no-console
  console.log(`[kartz] mongo connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = connectDB;
