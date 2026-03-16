import fetch from 'node-fetch';

async function testOrderSubmit() {
    console.log("🚀 Testing Order API Submission...");

    const payload = {
        fullName: "API Test User",
        phone: "5555555555",
        email: "apitest@example.com",
        periodsStarted: new Date().toISOString(),
        cycleLength: 28,
        phase: "Phase-1",
        totalQuantity: 1,
        totalWeight: 30, // 30g per laddu
        totalPrice: 45, // Example price
        address: {
            house: "123 Test St",
            area: "Test Area",
            pincode: "500001",
            landmark: "Near Test Park"
        },
        paymentMethod: "Cash on Delivery",
        message: "This is a test order via API script.",
        planType: "starter"
    };

    try {
        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization if your /orders endpoint requires it, 
                // but looking at orderRoutes.js, the POST /api/orders isn't protected by 'protect' middleware.
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log("✅ Order created successfully!");
            import('fs').then(fs => fs.writeFileSync('order_output.json', JSON.stringify(data, null, 2)));
        } else {
            console.error("❌ Failed to create order:");
            console.error(data);
        }
    } catch (error) {
        console.error("❌ Error running script:", error.message);
    }
}

testOrderSubmit();
