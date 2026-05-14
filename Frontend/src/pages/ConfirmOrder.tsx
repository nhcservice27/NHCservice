import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    CheckCircle2, CreditCard, Wallet,
    Truck, Package, ArrowRight, Loader2, AlertCircle, Calendar
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/Button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BoxPackingAnimation } from "@/components/BoxPackingAnimation";
import { useUser } from "@/context/UserContext";
import { formatDate } from "@/lib/utils";

export default function ConfirmOrder() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { customer } = useUser();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
    const [confirmed, setConfirmed] = useState(false);
    const [address, setAddress] = useState({
        house: "",
        area: "",
        landmark: "",
        pincode: ""
    });

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/public/${orderId}`);
                const data = await res.json();
                if (data.success) {
                    setOrder(data.data);
                    const orderAddr = data.data.address;
                    const profileAddr = customer?.addresses?.[0] || data.data.customerProfileAddress;

                    setAddress({
                        house: orderAddr?.house || profileAddr?.house || "",
                        area: orderAddr?.area || profileAddr?.area || "",
                        landmark: orderAddr?.landmark || profileAddr?.landmark || "",
                        pincode: orderAddr?.pincode || profileAddr?.pincode || ""
                    });

                    if (data.data.orderStatus !== 'Requested') {
                        setConfirmed(data.data.orderStatus === 'Confirmed' || data.data.orderStatus === 'Processing');
                    }
                } else {
                    toast.error("Order request not found");
                }
            } catch (err) {
                toast.error("Failed to load order details");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, customer]);

    const handleConfirm = async () => {
        if (!address.house || !address.area || !address.pincode) {
            toast.error("Please ensure your delivery destination is complete.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/orders/public/${orderId}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethod, address })
            });
            const data = await res.json();
            if (data.success) {
                setConfirmed(true);
                toast.success("Order confirmed successfully!");
            } else {
                toast.error(data.message || "Confirmation failed");
            }
        } catch (err) {
            toast.error("Error confirming order");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-wellness-cream/30 space-y-6">
            <Loader2 className="w-12 h-12 text-wellness-green animate-spin opacity-40" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Synchronizing Details...</p>
        </div>
    );

    if (!order && !confirmed) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-wellness-cream/30 p-10 text-center space-y-8">
            <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-foreground/20" />
            </div>
            <div className="space-y-4">
                <h1 className="text-4xl font-heading font-bold text-foreground">Protocol Not Found</h1>
                <p className="text-foreground/60 font-body max-w-xs mx-auto">This authentication link may have expired or is incorrect.</p>
            </div>
            <Button onClick={() => navigate('/')} variant="hero" className="rounded-full px-12">Return Home</Button>
        </div>
    );

    if (confirmed) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-wellness-cream/30 p-10 text-center">
             <div className="w-24 h-24 bg-wellness-green text-white rounded-full flex items-center justify-center mb-10 shadow-premium-lg scale-90 md:scale-100">
                <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-4 mb-12">
                <h1 className="text-5xl font-heading font-bold text-foreground">Ritual Confirmed.</h1>
                <p className="text-xl text-foreground/60 font-body max-w-md mx-auto">Your personalized protocol is being prepared for shipment.</p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="h-16 px-12 rounded-full border-foreground/5 hover:border-foreground/20 text-foreground/60">
                Explore More
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-wellness-cream/30 py-40 px-6">
            <div className="max-w-2xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-heading font-bold tracking-tight text-foreground">Finalize Protocol.</h1>
                    <p className="text-foreground/40 font-bold uppercase tracking-[0.2em] text-[10px]">Secure Order Confirmation</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-foreground/5 shadow-premium space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {/* Order Ritual Summary */}
                    <div className="p-10 bg-foreground text-background rounded-[2.5rem] shadow-premium-lg flex justify-between items-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                             <Package className="w-32 h-32" />
                        </div>
                        <div className="space-y-2 relative z-10">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-background/40 block leading-none">The Ritual</span>
                            <h3 className="text-2xl font-bold font-heading">{order.totalQuantity} {order.phase} Protocol</h3>
                            <div className="flex items-center gap-2 text-xs text-background/60 font-medium">
                                <Calendar className="w-3.5 h-3.5" /> Est. Arrival: {formatDate(order.deliveryDate)}
                            </div>
                        </div>
                        <div className="text-right relative z-10">
                             <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-background/40 block leading-none">Value</span>
                             <p className="text-4xl font-bold italic text-wellness-sage">₹{order.totalPrice}</p>
                        </div>
                    </div>

                    {/* Destination Ritual */}
                    <div className="space-y-8">
                         <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 px-2 flex items-center gap-2">
                                <Truck className="w-4 h-4" /> Shipping Destination
                            </h4>
                            <div className="h-[1px] w-full bg-foreground/5"></div>
                         </div>

                         <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Access Point (House/Flat)</Label>
                                <Input
                                    value={address.house}
                                    onChange={(e) => setAddress({ ...address, house: e.target.value })}
                                    className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6 focus:bg-white transition-all"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Locale (Area/Street)</Label>
                                    <Input
                                        value={address.area}
                                        onChange={(e) => setAddress({ ...address, area: e.target.value })}
                                        className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6 focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Zone (Pincode)</Label>
                                    <Input
                                        value={address.pincode}
                                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                        className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6 focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                            </div>
                         </div>
                    </div>

                    {/* Settlement Ritual */}
                    <div className="space-y-8">
                         <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 px-2 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Payment Selection
                            </h4>
                            <div className="h-[1px] w-full bg-foreground/5"></div>
                         </div>

                         <div className="grid gap-4">
                             {[
                                 { id: 'Cash on Delivery', label: 'Cash on Delivery', sub: 'Simplified post-arrival payment', icon: Wallet },
                                 { id: 'Online (Razorpay)', label: 'Digital Synchrony', sub: 'Razorpay, UPI, All Cards', icon: CreditCard }
                             ].map(method => (
                                <div 
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id)}
                                    className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${paymentMethod === method.id ? 'border-foreground bg-foreground/5' : 'border-foreground/5 hover:border-foreground/20'}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === method.id ? 'bg-foreground text-background' : 'bg-foreground/5 text-foreground/40 group-hover:text-foreground'}`}>
                                            <method.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground leading-none mb-1">{method.label}</p>
                                            <p className="text-xs text-foreground/40 font-body">{method.sub}</p>
                                        </div>
                                    </div>
                                    {paymentMethod === method.id && <div className="h-4 w-4 rounded-full bg-wellness-green"></div>}
                                </div>
                             ))}
                         </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleConfirm}
                            disabled={submitting}
                            variant="hero"
                            className="w-full h-16 rounded-full shadow-premium-lg group overflow-hidden"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                <span className="flex items-center justify-center gap-3">
                                    Secure Ritual <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-10 opacity-30 group">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                         <Truck className="w-3 h-3" /> Priority Logistics
                    </div>
                    <div className="h-4 w-px bg-foreground/20"></div>
                     <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                         <CheckCircle2 className="w-3 h-3" /> Purity Verified
                    </div>
                </div>
            </div>
        </div>
    );
}
