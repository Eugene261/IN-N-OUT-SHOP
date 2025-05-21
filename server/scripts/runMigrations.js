/**
 * Migration runner script
 * 
 * This script runs all migrations in sequence
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');

// Define the migrations to run in order
const migrations = [
  'migrateShippingZones.js'
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Run a migration script
const runMigration = (migrationScript) => {
  return new Promise((resolve, reject) => {
    console.log(`\n====== Running migration: ${migrationScript} ======\n`);
    
    const scriptPath = path.join(__dirname, migrationScript);
    const child = spawn('node', [scriptPath], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ Migration ${migrationScript} completed successfully`);
        resolve();
      } else {
        console.error(`\n❌ Migration ${migrationScript} failed with exit code: ${code}`);
        reject(new Error(`Migration ${migrationScript} failed with exit code: ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`\n❌ Error running migration ${migrationScript}:`, error);
      reject(error);
    });
  });
};

// Run all migrations in sequence
const runMigrations = async () => {
  try {
    console.log('🚀 Starting migrations...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Run each migration in sequence
    for (const migration of migrations) {
      await runMigration(migration);
    }
    
    console.log('\n✨ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  }
};

// Start the migration process
runMigrations(); 