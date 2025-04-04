const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../lib/db');
const Port = require('../models/Port');
const mongoose = require('mongoose');

async function migrateData() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Successfully connected to MongoDB');

    // Read the JSON file
    const jsonPath = path.join(__dirname, '../Data/data.json');
    console.log(`Reading data from: ${jsonPath}`);
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Data file not found at: ${jsonPath}`);
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Found ${jsonData.length} ports to migrate`);

    // Clear existing data
    console.log('Clearing existing data...');
    try {
      await Port.collection.drop();
      console.log('Existing collection dropped successfully');
    } catch (err) {
      if (err.code === 26) {
        console.log('No existing collection to drop');
      } else {
        throw err;
      }
    }

    // Insert new data in batches
    const batchSize = 1000;
    const totalBatches = Math.ceil(jsonData.length / batchSize);
    console.log(`Will process in ${totalBatches} batches of ${batchSize} documents`);

    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      await Port.insertMany(batch, { 
        ordered: false,
        lean: true
      });
      console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${totalBatches}`);
    }

    // Create indexes
    console.log('Creating indexes...');
    await Promise.all([
      Port.collection.createIndex({ name: 1 }),
      Port.collection.createIndex({ code: 1 }),
      Port.collection.createIndex({ display_name: 1 }),
      Port.collection.createIndex({ country: 1 }),
      Port.collection.createIndex({ region: 1 }),
      Port.collection.createIndex({ city: 1 }),
      Port.collection.createIndex({ state_name: 1 }),
      // Add compound indexes for common queries
      Port.collection.createIndex({ deleted: 1, verified: 1, display_name: 1 }),
      Port.collection.createIndex({ port_type: 1 })
    ]);
    console.log('Created indexes');

    const finalCount = await Port.countDocuments();
    console.log(`Migration completed. Final document count: ${finalCount}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateData(); 