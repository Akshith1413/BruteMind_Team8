import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('CRITICAL: MONGO_URI environment variable is missing.');
  process.exit(1);
}

const client = new MongoClient(uri);

let db = null;

export async function connectDB() {
  if (db) return db;
  try {
    console.log('Connecting to MongoDB Atlas Cluster...');
    await client.connect();
    db = client.db('BruteMind_Team8'); // Connect to specified database in URI path
    
    // Verify connection: Run a basic ping command
    const pingResult = await db.command({ ping: 1 });
    console.log('MongoDB connection verified successfully! Ping response:', pingResult);
    
    // Run a basic test query to ensure read/write access
    const collections = await db.listCollections().toArray();
    console.log(`Available collections: ${collections.map(c => c.name).join(', ') || 'None (new database)'}`);
    
    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Please call connectDB first.');
  }
  return db;
}

export { client };
