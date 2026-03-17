
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

    // Save success state to session storage to persist across refreshes
    useEffect(() => {
        if (showSuccess && confirmedOrder) {
            sessionStorage.setItem('last_confirmed_order', JSON.stringify(confirmedOrder));
            sessionStorage.setItem('last_order_address', JSON.stringify(address));
            sessionStorage.setItem('last_order_phone', phone);
            sessionStorage.setItem('show_success_persistence', 'true');
        }
    }, [showSuccess, confirmedOrder, address, phone]);

    useEffect(() => {
        // Attempt to restore success state from session storage
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
                return; // Don't redirect if we have a persisted success state
            }
        }

        if (!orderData) {
            toast.error("No order found. Redirecting to home.");
            navigate("/");
            return;
        }

        // Auto-advance if logged in
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

        // Load Razorpay Script
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

    const [existingCustomer, setExistingCustomer] = useState(null);

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
                const cust = result.customer as { name: string; phone: string; age?: number; addresses?: Array<{ house?: string; area?: string; landmark?: string; pincode?: string; label?: string; mapLink?: string }> };
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
                        label: (lastAddr.label as "Home" | "Work" | "Other") || "Home"
                    });
                }
                setExistingCustomer(cust);
                setStep(3);
                toast.success("Welcome back!");
            } else if (result.needsPasswordSetup) {
                toast.info("Please set your password first in the Profile page.");
                navigate("/profile");
            } else if (!result.success) {
                toast.info("New customer? Please provide your details to continue.");
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
            toast.error("Payment gateway is still loading. Please try again in a moment.");
            return;
        }

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY, // Test mode key from environment variable
            amount: (orderData.totalPrice * 100).toString(),
            currency: "INR",
            name: "Cycle Harmony",
            description: `Order for ${orderData.phase}`,
            image: "https://www.google.com/favicon.ico",
            handler: async function (response: any) {
                console.log("Payment Success:", response);
                toast.success("Payment Received!");
                await submitFinalOrder("Online (Razorpay)");
            },
            prefill: {
                name: name,
                email: email,
                contact: phone
            },
            theme: {
                color: "#f472b6"
            },
            modal: {
                ondismiss: function () {
                    setLoading(false);
                }
            }
        };

        try {
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                console.error("Razorpay Error:", response.error);
                toast.error("Payment Failed: " + response.error.description);
                setLoading(false);
            });
            rzp.open();
        } catch (err) {
            console.error("Razorpay Init Error:", err);
            toast.error("Could not initialize payment gateway.");
            setLoading(false);
        }
    };

    const submitFinalOrder = async (finalMethod: string) => {
        setLoading(true);
        try {
            const finalOrder = {
                ...orderData,
                email,
                fullName: name,
                phone,
                age,
                address,
                paymentMethod: finalMethod,
                planType: orderData.planType,
                nextDeliveryDate: orderData.nextDeliveryDate,
                shippingDate: orderData.shippingDate,
                autoPhase2: orderData.autoPhase2
            };

            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalOrder)
            });

            const data = await response.json();
            if (data.success) {
                // Persist identity for seamless redirect to profile
                localStorage.setItem('cycle_harmony_user_identity', phone || email);
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
            toast.error("Please fill all delivery details");
            return;
        }

        if (paymentMethod === "Razorpay") {
            setLoading(true);
            handleRazorpayPayment();
        } else {
            submitFinalOrder("Cash on Delivery");
        }
    };

    const renderSuccessScreen = () => {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in zoom-in duration-500">
                <div className="mb-4 relative flex justify-center scale-75 sm:scale-100">
                    <BoxPackingAnimation />
                </div>

                <h2 className="text-4xl font-black text-gray-900 mb-2 text-center">Order Confirmed!</h2>
                <p className="text-gray-500 font-medium mb-8 text-center max-w-sm">
                    Thank you for choosing Cycle Harmony. Your wellness journey continues!
                </p>

                <Card className="w-full border-none shadow-2xl bg-white overflow-hidden mb-8">
                    <div className="bg-gray-50/50 p-6 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                                <p className="font-bold text-lg text-gray-900">#{confirmedOrder?.orderId || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount Paid</p>
                                <p className="font-bold text-lg text-pink-600">₹{confirmedOrder?.totalPrice}</p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500">
                                <Smartphone className="w-4 h-4" />
                            </div>
                            <p>Notification sent to <span className="font-bold">{phone}</span></p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <p className="line-clamp-1">{address.house}, {address.area}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col w-full gap-4">
                    <Button
                        onClick={() => {
                            sessionStorage.removeItem('show_success_persistence');
                            navigate("/profile");
                        }}
                        className="h-14 bg-gray-900 hover:bg-black text-white text-lg font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
                    >
                        Track My Order
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            sessionStorage.removeItem('show_success_persistence');
                            navigate("/");
                        }}
                        className="h-14 text-pink-600 font-bold hover:bg-pink-50 rounded-2xl"
                    >
                        Continue Shopping
                    </Button>
                </div>
            </div>
        );
    };

    if (!orderData) return null;

    return (
        <div className="min-h-screen bg-pink-50/30">
            <Navbar />

            <div className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
                {authLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium tracking-wide">Restoring your session...</p>
                    </div>
                ) : showSuccess ? renderSuccessScreen() : (
                    <>
                        {/* Step Indicator */}
                        <div className="flex justify-between mb-8 px-4 relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-2 ${step >= s ? "bg-pink-500 text-white border-pink-500 scale-110" : "bg-white text-gray-400 border-gray-200"
                                        }`}
                                >
                                    {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Login */}
                        {step === 1 && (
                            <Card className="shadow-xl border-t-4 border-pink-400 animate-in fade-in slide-in-from-right-4 duration-300">
                                <CardHeader className="text-center">
                                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-pink-500" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold">Sign In to Continue</CardTitle>
                                    <CardDescription>Enter your email and password to proceed</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-4">
                                    <form onSubmit={handleStandardLogin} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="your@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full bg-pink-500 hover:bg-pink-600 text-white h-12"
                                            disabled={loading}
                                        >
                                            {loading ? "Verifying..." : "Sign In to Order"}
                                        </Button>
                                    </form>



                                    <div className="space-y-2 text-center text-xs text-gray-500">
                                        Data security is our priority. Your cycle data is encrypted.
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 2: Personal Details */}
                        {step === 2 && (
                            <Card className="shadow-xl border-t-4 border-pink-400 animate-in fade-in slide-in-from-right-4 duration-300">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-pink-500" />
                                        Personal Details
                                    </CardTitle>
                                    <CardDescription>We need these to process your delivery</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>Full Name</Label>
                                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Phone Number</Label>
                                            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 digit mobile" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Age</Label>
                                            <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="00" />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2" /> Back</Button>
                                    <Button onClick={() => setStep(3)} className="bg-pink-500 hover:bg-pink-600">Next <ArrowRight className="ml-2" /></Button>
                                </CardFooter>
                            </Card>
                        )}

                        {/* Step 3: Address & Payment */}
                        {step === 3 && (
                            <Card className="shadow-xl border-t-4 border-pink-400 animate-in fade-in slide-in-from-right-4 duration-300">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-pink-500" />
                                        Delivery Information
                                    </CardTitle>
                                    {existingCustomer && (
                                        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm mt-2 flex items-center gap-2">
                                            <span className="animate-pulse">✨</span> Welcome back! We found your details.
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h4 className="font-semibold text-gray-700 text-sm">Address Details</h4>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label className="text-xs text-gray-500 uppercase">House / Flat No.</Label>
                                                <Input value={address.house} onChange={e => setAddress({ ...address, house: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs text-gray-500 uppercase">Area / Street</Label>
                                                <Input value={address.area} onChange={e => setAddress({ ...address, area: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-gray-500 uppercase">Google Maps Link (Optional)</Label>
                                                    <Info
                                                        className="w-4 h-4 text-pink-500 cursor-pointer hover:text-pink-600 transition-colors"
                                                        onClick={() => setShowMapInstructions(!showMapInstructions)}
                                                    />
                                                </div>
                                                {showMapInstructions && (
                                                    <div className="text-xs text-gray-700 bg-pink-50/80 p-3 rounded-lg border border-pink-100 mb-1 leading-relaxed">
                                                        <p className="font-semibold mb-1 text-pink-700">How to get your Map Link:</p>
                                                        <ol className="list-decimal list-inside space-y-1 ml-1 opacity-90">
                                                            <li>Open Google Maps on your phone</li>
                                                            <li>Search or drop a pin at your home</li>
                                                            <li>Tap the <strong>Share</strong> button</li>
                                                            <li>Select <strong>Copy Link</strong> and paste here</li>
                                                        </ol>
                                                    </div>
                                                )}
                                                <Input placeholder="https://maps.app.goo.gl/..." value={address.mapLink || ""} onChange={e => setAddress({ ...address, mapLink: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label className="text-xs text-gray-500 uppercase">Pincode</Label>
                                                    <Input value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-xs text-gray-500 uppercase">Type</Label>
                                                    <select
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                                            <Smartphone className="w-4 h-4" /> Payment Method
                                        </h4>
                                        <div className="grid gap-3">
                                            <div
                                                onClick={() => setPaymentMethod("COD")}
                                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${paymentMethod === "COD" ? "border-pink-500 bg-pink-50/50" : "border-gray-100 hover:border-pink-200"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <span className="text-gray-600 font-bold">₹</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Cash on Delivery</p>
                                                        <p className="text-xs text-gray-500">Pay when you receive</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === "COD" && (
                                                    <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            <div
                                                onClick={() => setPaymentMethod("Razorpay")}
                                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${paymentMethod === "Razorpay" ? "border-pink-500 bg-pink-50/50" : "border-gray-100 hover:border-pink-200"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                                        <img src="https://razorpay.com/favicon.png" className="w-5 h-5" alt="R" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Online Payment</p>
                                                        <p className="text-xs text-gray-500">UPI, Cards, Netbanking (via Razorpay)</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === "Razorpay" && (
                                                    <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-900 text-white rounded-xl shadow-inner">
                                        <div className="flex justify-between text-sm opacity-80 mb-2">
                                            <span>Order Total:</span>
                                            <span>₹{orderData.totalPrice}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Payable Amount:</span>
                                            <span className="text-pink-400">₹{orderData.totalPrice}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-3">
                                    <Button
                                        onClick={handleFinishOrder}
                                        className="w-full h-14 text-lg bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-200"
                                        disabled={loading}
                                    >
                                        {loading ? "Processing..." : "Finish Order and Deliver 🚚"}
                                    </Button>
                                    <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="mr-2" /> Previous Step</Button>
                                </CardFooter>
                            </Card>
                        )}

                        <p className="text-center text-xs text-gray-400 mt-8">
                            By continuing, you agree to our Terms & Privacy Policy.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default Checkout;
