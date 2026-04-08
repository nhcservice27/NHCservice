import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { calculateCycleMessage } from "@/lib/cycleCalculator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { submitToGoogleSheet } from "@/lib/googleSheets";
import { submitOrder } from "@/lib/orderService";
import { Info, Home, MapPin, Package, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";

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

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const CycleCompanion = () => {
  const navigate = useNavigate();
  const { customer, isLoggedIn } = useUser();
  const [lastPeriodDate, setLastPeriodDate] = useState("");
  const [averageCycle, setAverageCycle] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (isLoggedIn && customer) {
      setName(customer.name);
    }
  }, [isLoggedIn, customer]);
  const [result, setResult] = useState<CycleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);

  const [checkoutStep, setCheckoutStep] = useState<'phone' | 'details' | 'address'>('phone');
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'complete'>('starter');
  const [age, setAge] = useState("");

  const [fullName, setFullName] = useState("");
  const [house, setHouse] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [showMapInfo, setShowMapInfo] = useState(false);

  // Function to check if customer exists
  const handlePhoneCheck = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Invalid Phone", {
        description: "Please enter a valid phone number",
      });
      return;
    }

    setCheckingPhone(true);
    try {
      const response = await fetch(`${API_BASE_URL}/check-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();

      if (data.exists && data.data) {
        // Customer exists
        setFullName(data.data.name);
        if (data.data.age) setAge(data.data.age.toString());
        // Pre-fill address if available
        if (data.data.addresses && data.data.addresses.length > 0) {
          const lastAddr = data.data.addresses[data.data.addresses.length - 1];
          setHouse(lastAddr.house || "");
          setArea(lastAddr.area || "");
          setLandmark(lastAddr.landmark || "");
          setPincode(lastAddr.pincode || "");
          setMapLink(lastAddr.mapLink || "");
          setLabel((lastAddr.label as "Home" | "Work" | "Other") || "Home");
        }

        toast.success(`Welcome back, ${data.data.name}!`);
        setCheckoutStep('address');
      } else {
        // New Customer
        setFullName(name);
        setCheckoutStep('details');
      }
    } catch (error) {
      console.error("Error checking phone:", error);
      toast.error("Connection Error", { description: "Could not verify phone number. Proceeding as new." });
      setCheckoutStep('details');
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleCheck = () => {
    if (!lastPeriodDate || !name || !averageCycle) {
      toast.error("Missing Information", {
        description: "Please fill in all fields",
      });
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const data = calculateCycleMessage({
        last_period_date: lastPeriodDate,
        today: today,
        average_cycle: parseInt(averageCycle),
        name: name,
      });

      setResult(data);

      setTimeout(() => {
        const planElement = document.getElementById('personalized-plan');
        if (planElement) {
          planElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      toast.success("Success! 🌸", {
        description: "Your personalized plan is ready",
      });
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to calculate cycle information. Please check your inputs.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    if (!result) {
      toast.error("No plan yet", {
        description: "Please check your phase first to generate a message.",
      });
      return;
    }

    const isComplete = selectedPlan === 'complete';
    const orderData = {
      fullName: name,
      periodsStarted: lastPeriodDate,
      cycleLength: parseInt(averageCycle),
      phase: result.phase,
      totalQuantity: isComplete ? result.complete_plan?.quantity : result.quantity,
      totalWeight: isComplete ? result.complete_plan?.weight : result.weight,
      totalPrice: isComplete ? result.complete_plan?.price : result.price_total,
      message: generateMessageForPlan(selectedPlan),
      planType: selectedPlan,
      nextDeliveryDate: isComplete ? result.next_delivery_date : null,
      shippingDate: isComplete ? result.shipping_date : null,
      autoPhase2: isComplete,
      phase1Qty: isComplete ? result.complete_plan?.phase1_qty : result.quantity,
      phase2Qty: isComplete ? result.complete_plan?.phase2_qty : 0
    };

    navigate("/checkout", { state: { orderData } });
  };

  const generateMessageForPlan = (plan: 'starter' | 'complete') => {
    if (!result) return "";

    // Original phase for complete plan, starterPhase for starter plan
    const isPhase1Complete = result.phase === 'Phase-1';
    const isPhase1Starter = (result.starterPhase || result.phase) === 'Phase-1';

    const completeSeeds = isPhase1Complete ? 'Flax + Pumpkin' : 'Sunflower + Sesame';
    const starterSeeds = isPhase1Starter ? 'Flax + Pumpkin' : 'Sunflower + Sesame';

    const currentPhaseName = result.phase === 'Phase-1' ? 'Phase 1' : 'Phase 2';
    const starterPhaseName = (result.starterPhase || result.phase) === 'Phase-1' ? 'Phase 1' : 'Phase 2';

    // Phase 1 & Phase 2 dates for clear display (Phase 1 = follicular, Phase 2 = luteal)
    const phase1Dates = result.phase === 'Phase-1'
      ? `${result.current_phase_start} to ${result.current_phase_end}`
      : `${result.next_phase_start} to ${result.next_phase_end}`;
    const phase2Dates = result.phase === 'Phase-2'
      ? `${result.current_phase_start} to ${result.current_phase_end}`
      : `${result.next_phase_start} to ${result.next_phase_end}`;

    const baseMessage = `Your last period started ${result.total_days_passed} days ago, so you are currently in ${currentPhaseName} of your cycle (${result.current_phase_start} to ${result.current_phase_end}). 🌷`;

    if (plan === 'starter') {
      const datesSection = `\n\n📅 Your cycle dates:\n• Phase 1 (Follicular): ${phase1Dates}\n• Phase 2 (Luteal): ${phase2Dates}`;

      const upcomingPhaseDates = isPhase1Starter ? phase1Dates : phase2Dates;
      const quantityText = result.isNextPhaseAdvance
        ? `\n\nSince this phase is almost over, we're getting you ready for the next one! We will send you ${result.quantity} ${starterPhaseName} Laddus (${starterSeeds}) for your upcoming ${starterPhaseName} (${upcomingPhaseDates}).`
        : `\n\nTo support your body right now, we will send you ${result.quantity} ${starterPhaseName} Laddus (${starterSeeds}) to cover the rest of this current phase.`;

      const note = `\n\nNote: Your cycle may change based on your lifestyle — the laddus count may change.`;

      return `Hi ${name} ma’am! 🌸\n\n${baseMessage}${datesSection}${quantityText}${note}`;
    } else {
      const q1 = isPhase1Complete ? result.complete_plan?.phase1_qty : result.complete_plan?.phase2_qty;
      const q2 = isPhase1Complete ? result.complete_plan?.phase2_qty : result.complete_plan?.phase1_qty;
      const p1 = isPhase1Complete ? '1' : '2';
      const p2 = isPhase1Complete ? '2' : '1';

      const delivery1DateStr = new Date(result.next_delivery_date!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const delivery2DateStr = result.phase === 'Phase-2' ? (result.next_phase_end || delivery1DateStr) : delivery1DateStr;
      const p1Seeds = isPhase1Complete ? 'Flax + Pumpkin' : 'Sunflower + Sesame';
      const p2Seeds = isPhase1Complete ? 'Sunflower + Sesame' : 'Flax + Pumpkin';

      const datesSection = `\n\n📅 Your cycle dates:\n• Phase 1 (Follicular): ${phase1Dates}\n• Phase 2 (Luteal): ${phase2Dates}`;

      let preamble = "";
      if (result.isNextPhaseAdvance) {
        preamble = `\n\nSince this phase is almost over, we're starting your complete supply from your next phase to keep things balanced!\n\n`;
      }

      const note = `\n\nNote: Your cycle may change based on your lifestyle — the laddus count may change.`;

      return `Hi ${name} ma’am! 🌸\n\n${baseMessage}${datesSection}${preamble}✨ Complete Balance Plan (Subscription):\n\n• Delivery 1: ${q1} Phase 1 laddus (Flax + Pumpkin) — we will deliver ${result.phase === 'Phase-2' ? `on ${delivery1DateStr} when your next phase begins` : 'now'}.\n• Delivery 2: ${q2} Phase 2 laddus (Sunflower + Sesame) — we will deliver on ${delivery2DateStr} automatically.\n\n📌 How it works: You get the full cycle covered. Phase 1 laddus arrive when your next period phase begins, and Phase 2 laddus arrive automatically when Phase 2 begins — no need to order again!\n\n✅ Subscription Active | 💰 10% Discount Applied${note}`;
    }
  };

  const handleConfirmAddress = () => {
    if (!result) return;
    if (!fullName || !house || !phone || !area || !pincode) {
      toast.error("Missing address details", { description: "Please fill in all required address fields." });
      return;
    }

    const phoneNumber = "919347122416";
    const phaseType = getDisplayPhase(result.message);
    const orderSummary = `\n\nPhase: ${phaseType}\nTotal Quantity 🍪: ${result.quantity} laddus\nTotal Weight ⚖️: ${result.weight}g\nTotal Price 💰: ₹${result.price_total}`;

    const addressLines = [
      `Full Name: ${fullName}`,
      `Age: ${age}`,
      `Phone: ${phone}`,
      `House/Flat No.: ${house}`,
      area && `Area: ${area}`,
      landmark && `Landmark: ${landmark}`,
      pincode && `Pincode: ${pincode}`,
      mapLink && `Map Link: ${mapLink}`,
      `Address Label: ${label}`,
      `Payment method: ${paymentMethod}`,
    ].filter(Boolean).join("\n");

    const text = `${result.message}${orderSummary}\n\nDelivery Details:\n${addressLines}\n\nOrder Confirmed 📦`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;

    window.open(url, "_blank");

    const formattedAddress = [house, area, landmark, pincode, mapLink ? `\n${mapLink}` : ""].filter(Boolean).join("+");

    submitToGoogleSheet({
      Timestamp: new Date().toISOString(),
      Full_name: fullName,
      Periods_Started: lastPeriodDate,
      Cycle_length: averageCycle,
      Phase: phaseType,
      Total_Quantity: result.quantity,
      Total_Weight: result.weight,
      Total_Price: result.price_total,
      Phone: phone,
      address: formattedAddress,
      Message: result.message
    });

    submitOrder({
      fullName,
      phone,
      age: parseInt(age) || 0,
      periodsStarted: lastPeriodDate,
      cycleLength: parseInt(averageCycle),
      phase: phaseType,
      totalQuantity: result.quantity,
      totalWeight: result.weight,
      totalPrice: result.price_total,
      address: {
        house,
        area,
        landmark: landmark || '',
        pincode,
        mapLink: mapLink || '',
        label: label || 'Home'
      },
      paymentMethod: paymentMethod || 'Cash on Delivery',
      message: result.message
    }).then((response) => {
      if (response.success) toast.success("Order Saved!");
      else console.error('Failed to save order:', response.error);
    });

    setAddressOpen(false);
  };

  const getDisplayPhase = (message: string) => {
    const isPhase2PreOrder = message.includes("Only") && message.includes("days left to complete Phase-1") && message.includes("Next Phase-2 laddus will start");
    const isPhase2Delivery = message.includes("Today is Day") && message.includes("Phase-2 laddus (Sunflower + Sesame)");
    return (isPhase2PreOrder || isPhase2Delivery) ? "Phase-2" : "Phase-1";
  };

  return (
    <section id="cycle-phase-checker" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            Cycle Phase Checker
          </h2>
          <p className="text-gray-600">Track your menstrual phase and get personalized laddu delivery plans</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Card - Form */}
          <Card className="shadow-xl border-0 bg-white/60 backdrop-blur-md">
            <CardHeader className="bg-pink-50/30 rounded-t-xl pb-4">
              <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                Cycle Details <span>📅</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">Name 💝</Label>
                <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="h-11 rounded-lg border-gray-200 bg-white/50 focus:border-pink-300 focus:ring-pink-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastPeriodDate" className="text-gray-700">Last Period Start Date</Label>
                <Input id="lastPeriodDate" type="date" value={lastPeriodDate} onChange={(e) => setLastPeriodDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="h-11 rounded-lg border-gray-200 bg-white/50 focus:border-pink-300 focus:ring-pink-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="averageCycle" className="text-gray-700">Average Cycle Length (days) 📊</Label>
                <Input id="averageCycle" type="number" value={averageCycle} onChange={(e) => setAverageCycle(e.target.value)} min="20" max="45" placeholder="e.g. 28" className="h-11 rounded-lg border-gray-200 bg-white/50 focus:border-pink-300 focus:ring-pink-100" />
              </div>
              <Button onClick={handleCheck} disabled={loading} className="w-full h-12 text-lg font-medium rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-200/50 transition-all mt-2">
                {loading ? "Calculating..." : "Only show My plan"}
              </Button>
            </CardContent>
          </Card>

          {/* Right Card - Results (NEW UI) */}
          <Card id="personalized-plan" className={`shadow-xl border-0 bg-white/60 backdrop-blur-md transition-all overflow-hidden ${result ? 'opacity-100' : 'opacity-90'}`}>
            {result ? (
              <div className="h-full flex flex-col">
                {/* Header Section */}
                <div className="bg-pink-300 p-6 text-white text-left">
                  <h3 className="text-2xl font-bold font-serif mb-1">Hi {name} ma'am! 🌸</h3>
                  <p className="opacity-95 text-sm leading-snug">
                    It has been {result.total_days_passed} days since your last period start.
                    Based on a {result.BB}-day cycle, you may be in Day {result.A} of a new cycle ({result.phase}).
                  </p>
                </div>

                <div className="p-6 flex-grow flex flex-col gap-6">
                  {/* Phase Indicator */}
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${result.phase === 'Phase-1' ? 'bg-pink-400' : 'bg-purple-400'}`}></div>
                    <h4 className="text-lg font-bold text-gray-800 font-serif">
                      Current: {result.phase === 'Phase-1' ? 'Follicular Phase' : 'Luteal Phase'}
                    </h4>
                  </div>

                  {/* Plan Selection Tabs */}
                  <div className="grid grid-cols-2 gap-2 bg-pink-50/50 p-1 rounded-xl">
                    <button
                      onClick={() => setSelectedPlan('starter')}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedPlan === 'starter' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      🌸 Starter Plan
                    </button>
                    <div className="relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-400 to-purple-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10">
                        Recommended
                      </div>
                      <button
                        onClick={() => setSelectedPlan('complete')}
                        className={`w-full h-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedPlan === 'complete' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        🌼 Complete Plan
                      </button>
                    </div>
                  </div>

                  {/* Plan Content */}
                  <div className="space-y-4">
                    <div className="bg-white/80 rounded-xl p-4 border border-pink-100">
                      <h5 className="font-bold text-gray-800 mb-2">
                        {selectedPlan === 'starter' ? 'Cycle Starter Plan' : 'Complete Balance Plan'}
                      </h5>
                      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line space-y-3">
                        {(() => {
                          const msg = generateMessageForPlan(selectedPlan);
                          if (selectedPlan === 'complete' && msg.includes('Delivery 1') && msg.includes('Delivery 2')) {
                            const parts = msg.split(/(?=• Delivery 1:)/);
                            if (parts.length === 2) {
                              const [before, rest] = parts;
                              const deliveryEnd = rest.indexOf('\n\n📌');
                              const deliveryPart = deliveryEnd >= 0 ? rest.slice(0, deliveryEnd) : rest;
                              const afterPart = deliveryEnd >= 0 ? rest.slice(deliveryEnd) : '';
                              return (
                                <>
                                  <span>{before.trim()}</span>
                                  <div className="px-3 py-2 my-2">
                                    <span className="font-bold">{deliveryPart.trim()}</span>
                                  </div>
                                  <span>{afterPart.trim()}</span>
                                </>
                              );
                            }
                          }
                          return <span>{msg}</span>;
                        })()}
                      </div>
                    </div>

                    {/* Order Summary Card (Matching user screenshot) */}
                    <div className="bg-pink-50/50 rounded-2xl p-6 border border-pink-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <Package className="w-5 h-5 text-pink-500" />
                        </div>
                        <h5 className="font-extrabold text-gray-800 text-lg">Order Summary</h5>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-500 font-medium">Phase Type:</span>
                          <span className="font-bold text-gray-800">
                            {selectedPlan === 'complete' ? 'Phase 1 + Phase 2' : (result.starterPhase || result.phase)}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-500 font-medium">Quantity:</span>
                          <span className="font-bold text-gray-800">
                            {selectedPlan === 'complete'
                              ? `${result.complete_plan?.phase1_qty} Laddus + ${result.complete_plan?.phase2_qty} Laddus`
                              : `${result.quantity} Laddus`
                            }
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-500 font-medium">Net Weight:</span>
                          <span className="font-bold text-gray-800">
                            {selectedPlan === 'complete' ? result.complete_plan?.weight : result.weight}g
                          </span>
                        </div>

                        {/* Pricing and secondary info integrated into the summary for a cleaner look */}
                        <div className="pt-4 border-t border-pink-100 mt-2 flex justify-between items-end">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Amount</span>
                            <span className="text-2xl font-black text-pink-500">
                              ₹{selectedPlan === 'complete' ? result.complete_plan?.price : result.price_total}
                            </span>
                          </div>
                          <div className="text-right">
                            {selectedPlan === 'complete' ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold text-[10px]">
                                10% SAVINGS
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium italic">One-time purchase</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={handleBuy}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-6 text-lg rounded-xl shadow-lg shadow-pink-200 transition-all mt-auto"
                  >
                    Proceed to Order
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Your Personalized Plan 🌿</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Enter your cycle details on the left to generate your custom wellness plan.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};
