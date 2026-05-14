import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';

dotenv.config();

async function checkCollections() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    let output = `Connected to DB: ${mongoose.connection.name}\n`;
    for (let c of collections) {
        const count = await db.collection(c.name).countDocuments();
        output += `Collection '${c.name}' has ${count} documents.\n`;
    }

    fs.writeFileSync('db_counts.txt', output);
    process.exit(0);
}

checkCollections();
