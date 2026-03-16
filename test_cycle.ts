import { calculateCycleMessage } from './src/lib/cycleCalculator.js';

const today = "2026-03-10"; // Today's date according to user state
const last_period_date = "2026-02-10"; // From user's screenshot
const average_cycle = 30;
const name = "nany";

try {
    const result = calculateCycleMessage({
        last_period_date,
        today,
        average_cycle,
        name
    });
    console.log("TEST RESULT:");
    console.log("Quantity:", result.quantity);
    console.log("Weight:", result.weight);
    console.log("Price:", result.price_total);
} catch (e) {
    console.error(e);
}
