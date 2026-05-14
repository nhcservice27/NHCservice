import fetch from 'node-fetch';

async function testDebugDb() {
    try {
        const response = await fetch('https://api.telegram.org/bot8334545549:AAGMR6Bm3dvsKdXspScVMhDUVmwI41C8dKI/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: 2091440465,
                text: '/debug_db'
            })
        });
        const data = await response.json();
        console.log("Response:", data);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

testDebugDb();
