const last_period_date = "2026-02-10";
const todayStr = "2026-03-10";
const cycleLength = 30;

const lastPeriodDate = new Date(last_period_date);
const today = new Date(todayStr);

let totalDaysPassed = Math.floor((today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
let currentDay = totalDaysPassed;

if (currentDay > cycleLength) {
    currentDay = ((currentDay - 1) % cycleLength) + 1;
}

const phase1Duration = Math.floor(cycleLength / 2);
const phase2Duration = cycleLength - phase1Duration;

let phase;
let phaseEndDay;

if (currentDay <= phase1Duration) {
    phase = "Phase-1";
    phaseEndDay = phase1Duration;
} else {
    phase = "Phase-2";
    phaseEndDay = cycleLength;
}

const remainingDays = phaseEndDay - currentDay;

const ladduWeight = 30;
const ladduRate = 0.866;
const MINIMUM_ORDER_QTY = 15;

const remainingInPhase = Math.max(1, remainingDays + 1);
const starterQuantity = Math.max(MINIMUM_ORDER_QTY, remainingInPhase);

console.log("Input:", { last_period_date, today: todayStr, cycleLength });
console.log("Calculated:");
console.log("totalDaysPassed:", totalDaysPassed);
console.log("currentDay:", currentDay);
console.log("phase:", phase);
console.log("phaseEndDay:", phaseEndDay);
console.log("remainingDays:", remainingDays);
console.log("remainingInPhase:", remainingInPhase);
console.log("starterQuantity:", starterQuantity);
