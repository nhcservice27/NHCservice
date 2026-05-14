import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
    try {
        console.log('🚀 Starting Verification Tests...');

        // 1. Create Standard Order
        console.log('\n📦 Testing Standard Order (Starter Plan)...');
        const res1 = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: "Standard Test",
                phone: "1111111111",
                planType: "starter",
                totalPrice: 500,
                totalQuantity: 12,
                totalWeight: 360,
                phase: "Phase-1",
                periodsStarted: new Date(),
                cycleLength: 28,
                address: { house: "123", area: "Test", pincode: "123456" }
            })
        });
        const data1 = await res1.json();
        if (data1.success) {
            console.log(`✅ Success! Customer ID: ${data1.data.customerId}, Order ID: ${data1.data.orderId}`);
        } else {
            console.error('❌ Failed Standard Order:', data1.message);
        }

        // 2. Create Complete Plan Order
        console.log('\n✨ Testing Complete Plan Order...');
        const res2 = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: "Complete Test",
                phone: "2222222222",
                planType: "complete",
                totalPrice: 1500,
                totalQuantity: 24,
                totalWeight: 720,
                phase: "Phase-1",
                periodsStarted: new Date(),
                cycleLength: 28,
                phase1_qty: 12,
                phase2_qty: 12,
                address: { house: "456", area: "Test", pincode: "654321" }
            })
        });
        const data2 = await res2.json();
        if (data2.success) {
            const order = Array.isArray(data2.data) ? data2.data[0] : data2.data;
            console.log(`✅ Success! Customer ID: ${order.customerId}, Order ID: ${order.orderId}`);
            if (Array.isArray(data2.data) && data2.data[1]) {
                console.log(`✅ Second Order ID: ${data2.data[1].orderId}`);
            }
        } else {
            console.error('❌ Failed Complete Plan Order:', data2.message);
        }

    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }
};

runTests();
