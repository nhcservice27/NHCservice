import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    CheckCircle2, CreditCard, Wallet,
    Truck, Package, ArrowRight, Loader2, AlertCircle, Calendar
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

                    // Priority for pre-filling:
                    // 1. Order's existing address (if any)
                    // 2. Logged in customer's primary address
                    // 3. Backend hint from customer profile
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
            toast.error("Please provide complete address details");
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
    );

    if (!order && !confirmed) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
            <h1 className="text-xl font-bold">Request not found</h1>
            <p className="text-gray-500 max-w-xs mt-2">This confirmation link may have expired or the order ID is incorrect.</p>
            <Button onClick={() => navigate('/')} className="mt-6 bg-pink-500">Go to Home</Button>
        </div>
    );

    if (confirmed) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5F7] p-4 text-center">
            <div className="mb-4 relative flex justify-center scale-75 sm:scale-100">
                <BoxPackingAnimation />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-8">Your wellness journey is officially set to begin.</p>
            <Button onClick={() => navigate('/')} variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50">
                Continue Shopping
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
                <div className="flex justify-center mb-8">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Cycle<span className="text-pink-600">Harmony</span></h1>
                </div>

                <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-bold">Confirm Your Order</CardTitle>
                        <p className="text-gray-500 text-sm mt-1">Verify delivery details and select payment method</p>
                    </CardHeader>

                    <CardContent className="space-y-8 pt-6">
                        {/* Order Summary */}
                        <div className="bg-pink-50/50 rounded-2xl p-6 border border-pink-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest mb-1">Items</p>
                                    <h3 className="text-lg font-black text-gray-900">{order.totalQuantity} Healthy {order.phase} Laddus</h3>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" /> Expected Delivery: {formatDate(order.deliveryDate)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest mb-1">Total</p>
                                    <p className="text-2xl font-black text-green-600">₹{order.totalPrice}</p>
                                </div>
                            </div>
                        </div>

                        {/* Address Selection/Verification */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                                <Truck className="w-5 h-5 text-pink-500" />
                                Delivery Address
                            </h4>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase">House / Flat / Plot No.</Label>
                                    <Input
                                        value={address.house}
                                        onChange={(e) => setAddress({ ...address, house: e.target.value })}
                                        className="bg-white/50 border-gray-100 focus:bg-white h-12 rounded-xl"
                                        placeholder="e.g. Flat 402, Sunshine Apts"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase">Area / Street / Colony</Label>
                                        <Input
                                            value={address.area}
                                            onChange={(e) => setAddress({ ...address, area: e.target.value })}
                                            className="bg-white/50 border-gray-100 focus:bg-white h-12 rounded-xl"
                                            placeholder="e.g. Jubilee Hills"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-gray-400 uppercase">Pincode</Label>
                                        <Input
                                            value={address.pincode}
                                            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                            className="bg-white/50 border-gray-100 focus:bg-white h-12 rounded-xl"
                                            placeholder="6-digit Pincode"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Selection */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-pink-500" />
                                Payment Method
                            </h4>

                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-3">
                                <div>
                                    <RadioGroupItem value="Cash on Delivery" id="cod" className="peer sr-only" />
                                    <Label
                                        htmlFor="cod"
                                        className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 bg-white hover:bg-gray-50 peer-data-[state=checked]:border-pink-500 peer-data-[state=checked]:bg-pink-50/30 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-100 p-2 rounded-lg group-peer-data-[state=checked]:bg-pink-100">
                                                <Wallet className="w-5 h-5 text-gray-600 group-peer-data-[state=checked]:text-pink-600" />
                                            </div>
                                            <span className="font-bold text-gray-700">Cash on Delivery</span>
                                        </div>
                                    </Label>
                                </div>

                                <div>
                                    <RadioGroupItem value="Online (Razorpay)" id="online" className="peer sr-only" />
                                    <Label
                                        htmlFor="online"
                                        className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 bg-white hover:bg-gray-50 peer-data-[state=checked]:border-pink-500 peer-data-[state=checked]:bg-pink-50/30 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-100 p-2 rounded-lg group-peer-data-[state=checked]:bg-pink-100">
                                                <CreditCard className="w-5 h-5 text-gray-600 group-peer-data-[state=checked]:text-pink-600" />
                                            </div>
                                            <div className="text-left">
                                                <span className="font-bold text-gray-700 block text-sm">Online Payment</span>
                                                <span className="text-[10px] text-gray-500">Razorpay / UPI / Card</span>
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>

                    <CardFooter className="pt-2 pb-8 px-8">
                        <Button
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="w-full h-14 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl text-lg font-black shadow-xl shadow-pink-200 group relative overflow-hidden transition-all"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Confirm Order <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                <div className="mt-8 text-center text-gray-400 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                        <Truck className="w-3.5 h-3.5" /> Fast Delivery
                    </div>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Quality Assured
                    </div>
                </div>
            </div>
        </div>
    );
}
