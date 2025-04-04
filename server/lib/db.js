const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // MongoDB connection options - removed deprecated options
    const options = {
      dbName: 'ports_database', // Match the database name from your MongoDB Atlas cluster
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 