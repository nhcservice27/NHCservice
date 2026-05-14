interface CycleInput {
  last_period_date: string;
  today: string;
  average_cycle: number;
  name: string;
}

interface CycleResult {
  message: string;
  phase: string;
  price_total: number;
  weight: number;
  quantity: number;
  A: number;
  B: number;
  D: number;
  BB: number;
  total_days_passed: number;
  starterPhase?: string;
  isNextPhaseAdvance?: boolean;
  current_phase_start?: string;
  current_phase_end?: string;
  next_phase_start?: string;
  next_phase_end?: string;
  next_delivery_date?: string;
  shipping_date?: string;
  complete_plan?: {
    quantity: number;
    weight: number;
    price: number;
    phase1_qty: number;
    phase2_qty: number;
  };
}

export function calculateCycleMessage(data: CycleInput): CycleResult {
  const lastPeriodDate = new Date(data.last_period_date);
  const today = new Date(data.today);
  const cycleLength = data.average_cycle;

  // Step 1: Calculate Current Day (0-indexed base)
  // Day 0 = last_period_date
  let totalDaysPassed = Math.floor((today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24));
  let currentDay = totalDaysPassed + 1; // Display as 1-indexed internally

  if (currentDay < 1) {
    throw new Error("Last period date cannot be in the future");
  }

  // If currentDay > cycle_length, reset cycle
  if (currentDay > cycleLength) {
    currentDay = ((currentDay - 1) % cycleLength) + 1;
  }

  // Step 2: Calculate Phase Duration
  // We use standard 14 days for Phase 1 as requested by the user's example
  const phase1Duration = 14;
  const phase2Duration = cycleLength - phase1Duration;

  // Step 3: Identify Current Phase
  let phase: string;
  let phaseEndDay: number;

  if (currentDay <= phase1Duration) {
    phase = "Phase-1";
    phaseEndDay = phase1Duration;
  } else {
    phase = "Phase-2";
    phaseEndDay = cycleLength;
  }

  // Calculate the dates for the current phase based on the start date of the *current* cycle
  const currentCycleStartDayMs = today.getTime() - ((currentDay - 1) * 24 * 60 * 60 * 1000);

  let phaseStartDayNum = phase === "Phase-1" ? 1 : phase1Duration + 1;
  let phaseEndDayNum = phase === "Phase-1" ? phase1Duration : cycleLength;

  const currentPhaseStartDate = new Date(currentCycleStartDayMs + ((phaseStartDayNum - 1) * 24 * 60 * 60 * 1000));
  const currentPhaseEndDate = new Date(currentCycleStartDayMs + ((phaseEndDayNum - 1) * 24 * 60 * 60 * 1000));

  const current_phase_start = currentPhaseStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const current_phase_end = currentPhaseEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Calculate next phase dates
  let nextPhaseStartDayNum, nextPhaseEndDayNum, nextCycleStartDayMs;
  if (phase === "Phase-1") {
    // Next phase is Phase-2 of the SAME cycle
    nextCycleStartDayMs = currentCycleStartDayMs;
    nextPhaseStartDayNum = phase1Duration + 1;
    nextPhaseEndDayNum = cycleLength;
  } else {
    // Next phase is Phase-1 of the NEXT cycle
    // We add cycleLength + 1 to account for the "next day" shift requested by the user
    nextCycleStartDayMs = currentCycleStartDayMs + ((cycleLength + 1) * 24 * 60 * 60 * 1000);
    nextPhaseStartDayNum = 1;
    nextPhaseEndDayNum = phase1Duration;
  }

  const nextPhaseStartDate = new Date(nextCycleStartDayMs + ((nextPhaseStartDayNum - 1) * 24 * 60 * 60 * 1000));
  const nextPhaseEndDate = new Date(nextCycleStartDayMs + ((nextPhaseEndDayNum - 1) * 24 * 60 * 60 * 1000));

  const next_phase_start = nextPhaseStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const next_phase_end = nextPhaseEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Step 4: Calculate Phase End Date & Delivery Date
  const remainingDays = phaseEndDay - currentDay;
  const nextDeliveryDate = new Date(today.getTime() + remainingDays * 24 * 60 * 60 * 1000);
  const shippingDate = new Date(nextDeliveryDate.getTime() - 2 * 24 * 60 * 60 * 1000);

  // Pricing & Quantity (Using env variables)
  const ladduWeight = 30;
  const RATE_P1 = Number(import.meta.env.VITE_PRICE_PER_LADDU_PHASE1 || 33.27);
  const RATE_P2 = Number(import.meta.env.VITE_PRICE_PER_LADDU_PHASE2 || 33.27);
  const DISCOUNT_COMPLETE = Number(import.meta.env.VITE_COMPLETE_PLAN_DISCOUNT || 0.9);

  // Determine remaining days including today.
  const remainingInPhase = Math.max(1, remainingDays + 1);

  // Starter Plan Recommendation
  // If remaining days < 8, we skip the rest of this phase and sell them 15 laddus for their NEXT phase instead.
  let starterQuantity = remainingInPhase;
  let starterPhase = phase;
  let isNextPhaseAdvance = false;

  if (remainingInPhase < 8) {
    starterQuantity = 15;
    starterPhase = phase === "Phase-1" ? "Phase-2" : "Phase-1";
    isNextPhaseAdvance = true;
  }

  const starterWeight = starterQuantity * ladduWeight;
  const currentRate = starterPhase === "Phase-1" ? RATE_P1 : RATE_P2;
  const starterPrice = Math.round(starterQuantity * currentRate);


  // Complete Plan Recommendation (Dynamic)
  // First phase = remaining days of current phase
  // Second phase = full duration of the other phase (CycleLength / 2)
  let phase1Qty, phase2Qty;

  if (isNextPhaseAdvance) {
    // If we advanced the starter plan, we also advance the complete plan
    // This provides a clean 15 + 15 start for the upcoming cycle instead of weird tail-end amounts.
    phase1Qty = 15;
    phase2Qty = 15;
  } else {
    // Normal calculation
    if (phase === "Phase-1") {
      phase1Qty = remainingInPhase;
      phase2Qty = phase2Duration;
    } else {
      phase2Qty = remainingInPhase;
      phase1Qty = phase1Duration;
    }
  }
  const completeQuantity = phase1Qty + phase2Qty;
  const completeWeight = completeQuantity * ladduWeight;

  const phase1Price = phase1Qty * RATE_P1;
  const phase2Price = phase2Qty * RATE_P2;
  const completePrice = Math.round((phase1Price + phase2Price) * DISCOUNT_COMPLETE); // Discount for complete plan


  // Format Dates for Message
  const nextDeliveryStr = nextDeliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return {
    message: "", // Placeholder, will be constructed in the component based on plan selected
    phase, // Original current phase
    starterPhase, // The phase the starter plan is actually for
    isNextPhaseAdvance,
    current_phase_start,
    current_phase_end,
    next_phase_start,
    next_phase_end,
    price_total: starterPrice, // Default to starter price
    weight: starterWeight,
    quantity: starterQuantity,
    A: currentDay,
    B: phase1Duration,
    D: remainingDays,
    BB: cycleLength,
    total_days_passed: totalDaysPassed,
    // New fields for subscription
    next_delivery_date: nextDeliveryDate.toISOString(),
    shipping_date: shippingDate.toISOString(),
    complete_plan: {
      quantity: completeQuantity,
      weight: completeWeight,
      price: completePrice,
      phase1_qty: phase1Qty,
      phase2_qty: phase2Qty
    }
  };
}
