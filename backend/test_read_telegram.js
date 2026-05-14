import fetch from 'node-fetch';

async function readReplies() {
    try {
        const response = await fetch('https://api.telegram.org/bot8334545549:AAGMR6Bm3dvsKdXspScVMhDUVmwI41C8dKI/getUpdates');
        const data = await response.json();
        if (data.ok && data.result) {
            // Get the last few messages to see what the bot sent or received
            const recent = data.result.slice(-5);
            console.log(JSON.stringify(recent, null, 2));
        }
    } catch (err) {
        console.error(err);
    }
}
readReplies();
