import { MongoClient } from 'mongodb';


const MONGO_URL = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = 'node_assignment';

let db: any;

export const connectDB = async () => {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
};

export const getDB = () => db;