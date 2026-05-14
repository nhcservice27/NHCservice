
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Mail, MapPin, User, ArrowRight, ArrowLeft, CheckCircle, Smartphone, Loader2, Info } from "lucide-react";
import { BoxPackingAnimation } from "@/components/BoxPackingAnimation";
import { useUser } from "@/context/UserContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { customer, isLoggedIn, loading: authLoading, login: globalLogin } = useUser();
    const orderData = location.state?.orderData;

    const [showSuccess, setShowSuccess] = useState(false);
    const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showMapInstructions, setShowMapInstructions] = useState(false);

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [age, setAge] = useState("");

    const [address, setAddress] = useState({
        house: "",
        area: "",
        landmark: "",
        mapLink: "",
        pincode: "",
        label: "Home"
    });

    useEffect(() => {
        if (showSuccess && confirmedOrder) {
            sessionStorage.setItem('last_confirmed_order', JSON.stringify(confirmedOrder));
            sessionStorage.setItem('last_order_address', JSON.stringify(address));
            sessionStorage.setItem('last_order_phone', phone);
            sessionStorage.setItem('show_success_persistence', 'true');
        }
    }, [showSuccess, confirmedOrder, address, phone]);

    useEffect(() => {
        const persistedSuccess = sessionStorage.getItem('show_success_persistence');
        if (persistedSuccess === 'true') {
            const savedOrder = sessionStorage.getItem('last_confirmed_order');
            const savedAddress = sessionStorage.getItem('last_order_address');
            const savedPhone = sessionStorage.getItem('last_order_phone');

            if (savedOrder) {
                setConfirmedOrder(JSON.parse(savedOrder));
                if (savedAddress) setAddress(JSON.parse(savedAddress));
                if (savedPhone) setPhone(savedPhone);
                setShowSuccess(true);
                return;
            }
        }

        if (!orderData) {
            toast.error("No order found. Redirecting to home.");
            navigate("/");
            return;
        }

        if (isLoggedIn && customer && !authLoading) {
            setStep(3);
            setName(customer.name || "");
            setPhone(customer.phone || "");
            setEmail(customer.email || "");
            if (customer.addresses?.length > 0) {
                const lastAddr = customer.addresses[customer.addresses.length - 1];
                setAddress({
                    house: lastAddr.house || "",
                    area: lastAddr.area || "",
                    landmark: lastAddr.landmark || "",
                    mapLink: lastAddr.mapLink || "",
                    pincode: lastAddr.pincode || "",
                    label: lastAddr.label || "Home"
                });
            }
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [orderData, navigate, isLoggedIn, customer, authLoading]);

    const [paymentMethod, setPaymentMethod] = useState<"COD" | "Razorpay">("COD");

    const handleStandardLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please enter email and password");
            return;
        }

        setLoading(true);
        try {
            const result = await globalLogin(email, password);

            if (result.success && result.customer) {
                const cust = result.customer as any;
                setName(cust.name);
                setPhone(cust.phone);
                if (cust.age) setAge(String(cust.age));
                if (cust.addresses?.length) {
                    const lastAddr = cust.addresses[cust.addresses.length - 1];
                    setAddress({
                        house: lastAddr.house || "",
                        area: lastAddr.area || "",
                        landmark: lastAddr.landmark || "",
                        mapLink: lastAddr.mapLink || "",
                        pincode: lastAddr.pincode || "",
                        label: lastAddr.label || "Home"
                    });
                }
                setStep(3);
                toast.success("Welcome back!");
            } else if (result.needsPasswordSetup) {
                toast.info("Please set your password first in the Profile page.");
                navigate("/profile");
            } else {
                setStep(2);
            }
        } catch (err) {
            toast.error("Connection error");
        } finally {
            setLoading(false);
        }
    };

    const handleRazorpayPayment = async () => {
        if (!(window as any).Razorpay) {
            toast.error("Payment gateway is loading...");
            return;
        }

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY,
            amount: (orderData.totalPrice * 100).toString(),
            currency: "INR",
            name: "Cycle Harmony",
            description: `Protocol: ${orderData.phase}`,
            handler: async function (response: any) {
                await submitFinalOrder("Online (Razorpay)", response);
            },
            prefill: { name, email, contact: phone },
            theme: { color: "#1A2F25" },
            modal: { ondismiss: () => setLoading(false) }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    };

    const submitFinalOrder = async (finalMethod: string, razorpayResponse?: any) => {
        setLoading(true);
        try {
            const finalOrder = {
                ...orderData,
                email,
                password,
                fullName: name,
                phone,
                age: parseInt(age),
                address,
                paymentMethod: finalMethod,
                razorpayPaymentId: razorpayResponse?.razorpay_payment_id
            };

            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(finalOrder)
            });

            const data = await response.json();
            if (data.success) {
                localStorage.setItem('cycle_harmony_user_identity', (email || phone).trim());
                setConfirmedOrder(data.data);
                setShowSuccess(true);
            } else {
                toast.error(data.message || "Order Failed");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleFinishOrder = async () => {
        if (!name || !phone || !address.house || !address.area || !address.pincode) {
            toast.error("Please share your shipping details.");
            return;
        }

        if (paymentMethod === "Razorpay") {
            handleRazorpayPayment();
        } else {
            submitFinalOrder("Cash on Delivery");
        }
    };

    const renderSuccessScreen = () => {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 animate-in fade-in zoom-in duration-1000">
                <div className="w-24 h-24 bg-wellness-green text-white rounded-full flex items-center justify-center mb-10 shadow-premium-lg">
                    <CheckCircle className="w-10 h-10" />
                </div>

                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-5xl md:text-6xl font-heading font-bold text-foreground tracking-tight">Ritual Confirmed.</h2>
                    <p className="text-xl text-foreground/60 font-body max-w-md mx-auto leading-relaxed">
                        Your personalized seeds are being handcrafted. Welcome to a more balanced you.
                    </p>
                </div>

                <div className="w-full bg-white rounded-[2.5rem] p-10 shadow-premium border border-foreground/5 space-y-8 mb-12">
                   <div className="flex justify-between items-center border-b border-foreground/5 pb-8">
                       <div className="space-y-1">
                           <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-foreground/30 block">Order Reference</span>
                           <span className="text-xl font-bold font-heading">#{confirmedOrder?.orderId || 'SYNC-X'}</span>
                       </div>
                       <div className="text-right space-y-1">
                           <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-foreground/30 block">Protocol Amount</span>
                           <span className="text-xl font-bold italic text-wellness-green">₹{confirmedOrder?.totalPrice}</span>
                       </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8 text-sm">
                       <div className="space-y-2">
                            <span className="font-bold uppercase tracking-widest text-[10px] text-foreground/40 block leading-none">Destination</span>
                            <p className="text-foreground/70 font-body leading-relaxed">{address.house}, {address.area}</p>
                       </div>
                       <div className="space-y-2">
                             <span className="font-bold uppercase tracking-widest text-[10px] text-foreground/40 block leading-none">Contact</span>
                             <p className="text-foreground/70 font-body leading-relaxed">{phone}</p>
                       </div>
                   </div>
                </div>

                <div className="flex flex-col w-full gap-4 max-w-sm">
                    <Button
                        onClick={() => {
                            sessionStorage.removeItem('show_success_persistence');
                            window.location.assign("/profile");
                        }}
                        variant="hero"
                        className="h-16 rounded-full shadow-premium-lg"
                    >
                        Track My Ritual <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            sessionStorage.removeItem('show_success_persistence');
                            navigate("/");
                        }}
                        className="h-16 rounded-full border-foreground/10 text-foreground/40 hover:text-foreground hover:border-foreground"
                    >
                        Home
                    </Button>
                </div>
            </div>
        );
    };

    if (!orderData) return null;

    return (
        <div className="min-h-screen bg-wellness-cream/30">
            <Navbar />

            <div className="container mx-auto px-6 py-40 max-w-2xl">
                {authLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                        <Loader2 className="w-12 h-12 text-wellness-green animate-spin opacity-40" />
                        <p className="text-foreground/40 font-bold uppercase tracking-widest text-[10px]">Syncing Identity...</p>
                    </div>
                ) : showSuccess ? renderSuccessScreen() : (
                    <>
                        {/* Elegant Step Indicator */}
                        <div className="flex justify-between items-center mb-20 px-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-foreground/5 -z-10"></div>
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-700 border ${
                                        step >= s 
                                        ? "bg-foreground text-background border-foreground scale-110 shadow-premium" 
                                        : "bg-white text-foreground/20 border-foreground/5"
                                    }`}
                                >
                                    {step > s ? <CheckCircle className="w-5 h-5" /> : `0${s}`}
                                </div>
                            ))}
                        </div>

                        {/* Form Body */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-foreground/5 shadow-premium animate-in fade-in slide-in-from-bottom-8 duration-1000">
                             
                             {/* Step 1: Identity */}
                             {step === 1 && (
                                <div className="space-y-10">
                                    <div className="text-center space-y-4">
                                        <h2 className="text-4xl font-heading font-bold text-foreground">Welcome Back</h2>
                                        <p className="text-foreground/60 font-body">Sign in to your wellness account to proceed.</p>
                                    </div>

                                    <form onSubmit={handleStandardLogin} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Access Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                autoComplete="username"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6 focus:bg-white focus:ring-primary/20 transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Security Key</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                autoComplete="current-password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6 focus:bg-white focus:ring-primary/20 transition-all"
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            variant="hero"
                                            className="w-full h-16 rounded-full shadow-premium md:mt-4"
                                            disabled={loading}
                                        >
                                            {loading ? "Verifying..." : "Synchronize & Continue"}
                                        </Button>
                                    </form>
                                    
                                    <div className="flex items-center gap-4 py-4">
                                        <div className="h-[1px] flex-grow bg-foreground/5"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/20">New Here?</span>
                                        <div className="h-[1px] flex-grow bg-foreground/5"></div>
                                    </div>

                                    <Button 
                                        variant="outline" 
                                        onClick={() => setStep(2)}
                                        className="w-full h-16 rounded-full border-foreground/5 text-foreground/60 hover:text-foreground"
                                    >
                                        Proceed manually <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                             )}

                             {/* Step 2: Personal Profile */}
                             {step === 2 && (
                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-heading font-bold text-foreground">Tell us about you.</h3>
                                        <div className="h-1 w-12 bg-wellness-green rounded-full"></div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Your Name</Label>
                                            <Input 
                                                value={name} 
                                                onChange={e => setName(e.target.value)} 
                                                placeholder="e.g. Sarah Miller"
                                                className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Contact Mobile</Label>
                                                <Input 
                                                    value={phone} 
                                                    onChange={e => setPhone(e.target.value)} 
                                                    placeholder="93471XXXXX"
                                                    className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Your Age</Label>
                                                <Input type="number" value={age} onChange={e => setAge(e.target.value)} className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-10">
                                        <Button variant="outline" onClick={() => setStep(1)} className="h-16 rounded-full px-8">Back</Button>
                                        <Button onClick={() => setStep(3)} variant="hero" className="flex-grow h-16 rounded-full">Delivery Details <ArrowRight className="h-4 w-4 ml-2" /></Button>
                                    </div>
                                </div>
                             )}

                             {/* Step 3: Destination */}
                             {step === 3 && (
                                <div className="space-y-10">
                                     <div className="space-y-4">
                                        <h3 className="text-3xl font-heading font-bold text-foreground">Shipping Ritual.</h3>
                                        <div className="h-1 w-12 bg-wellness-green rounded-full"></div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="grid gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">House / Flat No.</Label>
                                                <Input
                                                    value={address.house}
                                                    onChange={e => setAddress({ ...address, house: e.target.value })}
                                                    className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Area / Street</Label>
                                                <Input
                                                    value={address.area}
                                                    onChange={e => setAddress({ ...address, area: e.target.value })}
                                                    className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Pincode</Label>
                                                    <Input
                                                        value={address.pincode}
                                                        onChange={e => setAddress({ ...address, pincode: e.target.value })}
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        className="h-14 rounded-2xl border-foreground/5 bg-foreground/5 px-6"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Label</Label>
                                                    <select
                                                        className="flex h-14 w-full rounded-2xl border border-foreground/5 bg-foreground/5 px-6 py-2 text-sm focus:outline-none focus:ring-0"
                                                        value={address.label}
                                                        onChange={e => setAddress({ ...address, label: e.target.value })}
                                                    >
                                                        <option>Home</option>
                                                        <option>Work</option>
                                                        <option>Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                             <Label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 px-2">Preferred Payment</Label>
                                             <div className="grid gap-3">
                                                 {[
                                                     { id: 'COD', label: 'Cash on Delivery', sub: 'Pay upon ritual arrival' },
                                                     { id: 'Razorpay', label: 'Online Payment', sub: 'UPI, Cards, Netbanking' }
                                                 ].map(method => (
                                                     <div 
                                                        key={method.id}
                                                        onClick={() => setPaymentMethod(method.id as any)}
                                                        className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${paymentMethod === method.id ? 'border-foreground bg-foreground/5' : 'border-foreground/5 hover:border-foreground/20'}`}
                                                     >
                                                         <div>
                                                             <p className="text-sm font-bold text-foreground leading-none mb-1">{method.label}</p>
                                                             <p className="text-xs text-foreground/40 font-body">{method.sub}</p>
                                                         </div>
                                                         {paymentMethod === method.id && <div className="h-4 w-4 rounded-full bg-wellness-green"></div>}
                                                     </div>
                                                 ))}
                                             </div>
                                        </div>

                                        <div className="p-10 bg-foreground text-background rounded-[2.5rem] shadow-premium flex justify-between items-center">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-bold tracking-widest text-background/40 leading-none">Total Value</p>
                                                <p className="text-3xl font-bold font-heading">₹{orderData.totalPrice}</p>
                                            </div>
                                            <div className="text-right">
                                                 <p className="text-[10px] uppercase font-bold tracking-widest text-background/40 leading-none">Processing</p>
                                                 <p className="text-xs font-medium">Synced Protocol</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-10">
                                         <Button variant="outline" onClick={() => setStep(2)} className="h-16 rounded-full px-8 border-foreground/5 text-foreground/30">Back</Button>
                                         <Button 
                                            onClick={handleFinishOrder} 
                                            variant="hero" 
                                            className="flex-grow h-16 rounded-full transition-premium shadow-premium-lg"
                                            disabled={loading}
                                         >
                                            {loading ? "Finalizing..." : "Place Your Order"}
                                         </Button>
                                    </div>
                                </div>
                             )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Checkout;
