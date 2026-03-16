import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';

dotenv.config();

async function listAllDatabases() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Get the admin database
    const adminDb = mongoose.connection.client.db().admin();

    // List databases
    const dbList = await adminDb.listDatabases();

    let output = "Databases found:\n";
    for (const db of dbList.databases) {
        output += `- ${db.name} (${Math.round(db.sizeOnDisk / 1024)} KB)\n`;

        // Also peak into collections of this database
        const targetDb = mongoose.connection.client.db(db.name);
        const collections = await targetDb.listCollections().toArray();
        for (let c of collections) {
            const count = await targetDb.collection(c.name).countDocuments();
            if (count > 0) {
                output += `    ↳ ${c.name}: ${count} docs\n`;
            }
        }
    }

    fs.writeFileSync('db_list.txt', output);
    process.exit(0);
}

listAllDatabases();
