import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/Button";
import { toast } from "sonner";
import { calculateCycleMessage } from "@/lib/cycleCalculator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { submitToGoogleSheet } from "@/lib/googleSheets";
import { submitOrder } from "@/lib/orderService";
import { Info, Home, MapPin, Package, Calendar, ArrowRight, Flower2 } from "lucide-react";
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

  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'complete'>('starter');

  const handleCheck = () => {
    if (!lastPeriodDate || !name || !averageCycle) {
      toast.error("Information Required", {
        description: "Please share your details to generate your ritual.",
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
          planElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      toast.success("Ritual Generated", {
        description: "Your personalized wellness path is ready.",
      });
    } catch (error) {
      toast.error("Calculation Error", {
        description: error instanceof Error ? error.message : "Failed to sync with your cycle.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    if (!result) {
      toast.error("No plan generated", {
        description: "Please calculate your phase ritual first.",
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

    const isPhase1Starter = (result.starterPhase || result.phase) === 'Phase-1';
    const starterSeeds = isPhase1Starter ? 'Flax + Pumpkin' : 'Sunflower + Sesame';
    const starterPhaseName = (result.starterPhase || result.phase) === 'Phase-1' ? 'Phase 1' : 'Phase 2';

    const phase1Dates = result.phase === 'Phase-1'
      ? `${result.current_phase_start} to ${result.current_phase_end}`
      : `${result.next_phase_start} to ${result.next_phase_end}`;
    const phase2Dates = result.phase === 'Phase-2'
      ? `${result.current_phase_start} to ${result.current_phase_end}`
      : `${result.next_phase_start} to ${result.next_phase_end}`;

    const baseMessage = `Your last period started ${result.total_days_passed} days ago. Current Phase: ${result.phase === 'Phase-1' ? 'Phase 1' : 'Phase 2'} (${result.current_phase_start} to ${result.current_phase_end}).`;

    if (plan === 'starter') {
      const quantityText = result.isNextPhaseAdvance
        ? `\n\nPlan: Delivery of ${result.quantity} ${starterPhaseName} Laddus (${starterSeeds}) for your upcoming ${starterPhaseName} (${isPhase1Starter ? phase1Dates : phase2Dates}).`
        : `\n\nPlan: Delivery of ${result.quantity} ${starterPhaseName} Laddus (${starterSeeds}) for your current ${starterPhaseName}.`;
      
      return `Wellness Ritual for ${name}\n\n${baseMessage}${quantityText}\n\nNote: Handcrafted to order.`;
    } else {
      const q1 = result.complete_plan?.phase1_qty;
      const q2 = result.complete_plan?.phase2_qty;
      const delivery1DateStr = new Date(result.next_delivery_date!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      
      return `Complete Balance Ritual for ${name}\n\n${baseMessage}\n\n✨ Complete Balance Plan:\n• Delivery 1: ${q1} Phase 1 laddus (Flax + Pumpkin) - ${result.phase === 'Phase-2' ? `Arriving ${delivery1DateStr}` : 'Arriving Soon'}.\n• Delivery 2: ${q2} Phase 2 laddus (Sunflower + Sesame) - Arriving automatically for Luteal phase.\n\n✅ 10% Subscription Discount Applied.`;
    }
  };

  return (
    <section id="cycle-phase-checker" className="py-32 px-6 bg-white relative">
      <div className="absolute inset-0 mesh-bg-green opacity-20 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20 space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-foreground/5 text-foreground/40 text-[10px] uppercase font-bold tracking-[0.2em]">
            Personalized Guidance
          </div>
          <h2 className="text-5xl md:text-7xl font-heading font-bold text-foreground tracking-tight">
             Find Your <span className="italic text-wellness-green">Phase.</span>
          </h2>
          <p className="text-xl text-foreground/60 max-w-2xl mx-auto font-body">
            Share your details to receive a precisely timed nutritional ritual unique to your cycle.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Form Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[2.5rem] border border-foreground/5 shadow-premium p-10 h-full flex flex-col justify-between">
              <div className="space-y-10">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold font-heading text-foreground uppercase tracking-wider">Sync Details</h3>
                  <div className="h-1 w-12 bg-wellness-green rounded-full"></div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-foreground/40">Full Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g. Sarah Miller" 
                      className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6 focus:bg-white focus:ring-primary/20 transition-all font-body" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastPeriodDate" className="text-xs font-bold uppercase tracking-widest text-foreground/40">Last Period Start</Label>
                    <Input 
                      id="lastPeriodDate" 
                      type="date" 
                      value={lastPeriodDate} 
                      onChange={(e) => setLastPeriodDate(e.target.value)} 
                      className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6 focus:bg-white focus:ring-primary/20 transition-all font-body" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="averageCycle" className="text-xs font-bold uppercase tracking-widest text-foreground/40">Cycle Frequency (Days)</Label>
                    <Input 
                      id="averageCycle" 
                      type="number" 
                      value={averageCycle} 
                      onChange={(e) => setAverageCycle(e.target.value)} 
                      placeholder="28" 
                      className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6 focus:bg-white focus:ring-primary/20 transition-all font-body" 
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCheck} 
                disabled={loading} 
                variant="hero"
                className="w-full h-16 rounded-full mt-10 transition-premium shadow-premium-lg"
              >
                {loading ? "Syncing..." : "Analyze My Rhythm"}
              </Button>
            </div>
          </div>

          {/* Results Side */}
          <div className="lg:col-span-7" id="personalized-plan">
            {result ? (
              <div className="bg-foreground text-background rounded-[2.5rem] shadow-premium-lg flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-700">
                {/* Prescription Header */}
                <div className="p-10 border-b border-background/10 bg-gradient-to-br from-foreground to-foreground/95">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-primary">Prescribed Ritual</span>
                      <h3 className="text-3xl font-heading font-bold leading-tight">Sync Ritual for <br/>{name}</h3>
                    </div>
                    <div className="px-4 py-1.5 rounded-full border border-background/20 text-[10px] font-bold">
                       ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 opacity-60 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Day {result.A} of Cycle
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" /> Balanced Protocol
                    </div>
                  </div>
                </div>

                <div className="p-10 flex-grow space-y-10">
                  {/* Plan Selection */}
                  <div className="bg-background/5 p-1 rounded-full grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedPlan('starter')}
                      className={`h-12 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedPlan === 'starter' ? 'bg-background text-foreground shadow-sm' : 'text-background/40 hover:text-background/60'}`}
                    >
                      Cycle Starter
                    </button>
                    <button
                      onClick={() => setSelectedPlan('complete')}
                      className={`h-12 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedPlan === 'complete' ? 'bg-background text-foreground shadow-sm' : 'text-background/40 hover:text-background/60'}`}
                    >
                      Complete Set
                    </button>
                  </div>

                  {/* Summary Box */}
                  <div className="space-y-8">
                    <div className="flex justify-between items-end border-b border-background/10 pb-6">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-background/30 block">Target Phase</span>
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${result.phase === 'Phase-1' ? 'bg-wellness-green' : 'bg-wellness-pink'}`}></div>
                           <span className="text-xl font-bold uppercase tracking-tight">{result.phase === 'Phase-1' ? 'Follicular' : 'Luteal'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-background/30 block">Protocol Amount</span>
                        <span className="text-2xl font-bold italic">₹{selectedPlan === 'complete' ? result.complete_plan?.price : result.price_total}</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <p className="text-base text-background/70 font-body leading-relaxed whitespace-pre-line italic">
                        {generateMessageForPlan(selectedPlan)}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleBuy}
                    variant="hero"
                    className="w-full h-16 rounded-full bg-white text-foreground hover:bg-wellness-green hover:text-white group"
                  >
                    Confirm Ritual & Proceed <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full rounded-[2.5rem] border border-dashed border-foreground/10 flex flex-col items-center justify-center p-20 text-center space-y-8 opacity-40">
                <div className="w-24 h-24 rounded-full border border-foreground/10 flex items-center justify-center">
                   <Flower2 className="w-10 h-10 text-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-heading">Awaiting Your Rhythm</h3>
                  <p className="max-w-xs text-sm font-body leading-relaxed">
                    Complete your synchronization profile on the left to unlock your personalized protocol.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
