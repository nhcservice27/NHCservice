import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Search, Package, Calendar, Clock, CheckCircle, Truck, XCircle,
    User, MapPin, Settings, LogOut, ChevronRight, ShoppingBag, CreditCard, Send,
    AlertCircle, ArrowLeft
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { formatDate } from "@/lib/utils";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Plus } from "lucide-react";

import { useUser } from "@/context/UserContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function CustomerProfile() {
    const navigate = useNavigate();
    const { customer, isLoggedIn, loading, login, register, setPassword, logout, updateCustomerData } = useUser();
    const [email, setEmail] = useState("");
    const [authStep, setAuthStep] = useState<'email' | 'login' | 'register' | 'setPassword'>('email');
    const [password, setPasswordInput] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registerForm, setRegisterForm] = useState({
        name: "",
        phone: "",
        age: "",
        gender: ""
    });
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "overview";
    const selectedOrderId = searchParams.get("order");

    const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
    const [newAddress, setNewAddress] = useState({
        house: "",
        area: "",
        landmark: "",
        pincode: "",
        label: "Home"
    });

    useEffect(() => {
        if (isLoggedIn && customer) {
            fetchOrders(customer._id);
        }
    }, [isLoggedIn, customer]);

    useEffect(() => {
        if (!isLoggedIn) {
            setAuthStep("email");
            const saved = localStorage.getItem("cycle_harmony_user_identity");
            if (saved && saved.includes("@")) setEmail(saved);
        }
    }, [isLoggedIn]);

    const fetchOrders = async (customerId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/customer-orders/${customerId}`);
            const data = await response.json();
            if (data.success) {
                // Sort oldest first so A001A01 appears at top
                const sorted = [...data.orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                setOrders(sorted);
            }
        } catch (error) {
            console.error("Fetch orders error:", error);
        }
    };

    // Derived selectedOrder
    const selectedOrder = orders.find(o => o._id === selectedOrderId) || null;


    const handleCheckEmail = async () => {
        if (!email?.trim()) {
            toast.error("Please enter your email");
            return;
        }
        if (!email.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/check-customer-by-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Server error: ${response.status}`);
            }
            if (data.exists) {
                setAuthStep("login");
            } else {
                setAuthStep("register");
            }
        } catch (err) {
            console.error("Check email error:", err);
            toast.error("Could not verify email. Please check your connection and try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLoginClick = async () => {
        if (!password) {
            toast.error("Please enter your password");
            return;
        }
        const result = await login(email.trim(), password);
        if (result.needsPasswordSetup) {
            setAuthStep("setPassword");
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerForm.name?.trim() || !registerForm.phone?.trim() || !registerForm.age || !password) {
            toast.error("Please fill all required fields");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        const result = await register({
            email: email.trim(),
            name: registerForm.name.trim(),
            phone: registerForm.phone.trim(),
            age: Number(registerForm.age),
            gender: registerForm.gender || undefined,
            password,
        });
        if (result.success) {
            setRegisterForm({ name: "", phone: "", age: "", gender: "" });
            setPasswordInput("");
            setConfirmPassword("");
        }
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        const result = await setPassword(email.trim(), newPassword);
        if (result.success) {
            setAuthStep("login");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordInput("");
        }
    };

    const handleBackToEmail = () => {
        setAuthStep("email");
        setPasswordInput("");
        setNewPassword("");
        setConfirmPassword("");
        setRegisterForm({ name: "", phone: "", age: "", gender: "" });
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const resetEmail = forgotPasswordEmail.trim() || email.trim();
        if (!resetEmail || !resetEmail.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/customer-forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("If an account exists with this email, you will receive a reset link shortly.");
                setForgotPasswordOpen(false);
                setForgotPasswordEmail("");
            } else {
                toast.error(data.message || "Something went wrong");
            }
        } catch (err) {
            toast.error("Could not send reset email");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNewAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAddress.house || !newAddress.area || !newAddress.pincode) {
            toast.error("Please fill required fields");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/customers/${customer._id}/addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAddress)
            });
            const data = await response.json();

            if (data.success) {
                updateCustomerData({ addresses: data.data });
                setIsAddAddressOpen(false);
                setNewAddress({ house: "", area: "", landmark: "", pincode: "", label: "Home" });
                toast.success("Address added successfully");
            } else {
                toast.error(data.message || "Failed to add address");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteAddress = async (index: number) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/customers/${customer._id}/addresses/${index}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                updateCustomerData({ addresses: data.data });
                toast.success("Address deleted successfully");
            } else {
                toast.error(data.message || "Failed to delete address");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpgradePlan = async () => {
        if (!confirm("Are you sure you want to upgrade to the Complete Balance Plan subscription?")) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/customers/${customer._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planType: 'complete',
                    subscriptionStatus: 'active',
                    autoPhase2: true
                })
            });
            const data = await response.json();
            if (data.success) {
                updateCustomerData({ planType: 'complete', subscriptionStatus: 'active', autoPhase2: true });
                toast.success("Successfully upgraded to Complete Balance Plan!");
            } else {
                toast.error(data.message || "Failed to upgrade plan");
            }
        } catch (error) {
            toast.error("Network error upgrading plan");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderTrackingTimeline = (status: string) => {
        const stages = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
        const currentIndex = stages.indexOf(status);

        return (
            <div className="py-8 px-4">
                <div className="relative flex justify-between items-center max-w-2xl mx-auto">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-10"></div>
                    <div
                        className="absolute top-1/2 left-0 h-0.5 bg-pink-500 transition-all duration-1000 -translate-y-1/2 -z-10"
                        style={{ width: `${Math.max(0, (currentIndex / (stages.length - 1)) * 100)}%` }}
                    ></div>

                    {stages.map((stage, idx) => {
                        const isCompleted = idx <= currentIndex;
                        const isActive = idx === currentIndex;
                        const Icon = idx === 0 ? Clock : idx === 1 ? CheckCircle : idx === 2 ? Package : idx === 3 ? Truck : CheckCircle;

                        return (
                            <div key={stage} className="flex flex-col items-center gap-3 relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${isCompleted ? 'bg-pink-500 text-white' : 'bg-white text-gray-300 border-2 border-gray-100'
                                    } ${isActive ? 'ring-4 ring-pink-100 scale-110' : ''}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isCompleted ? 'text-pink-600' : 'text-gray-400'}`}>
                                        {stage}
                                    </p>
                                    {isActive && <Badge className="mt-1 bg-pink-50 text-pink-600 border-none text-[8px] animate-pulse">Current</Badge>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            Pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
            Confirmed: { color: "bg-blue-100 text-blue-700", icon: CheckCircle },
            Processing: { color: "bg-purple-100 text-purple-700", icon: Package },
            Shipped: { color: "bg-indigo-100 text-indigo-700", icon: Truck },
            Delivered: { color: "bg-green-100 text-green-700", icon: CheckCircle },
            Cancelled: { color: "bg-red-100 text-red-700", icon: XCircle },
            Requested: { color: "bg-pink-100 text-pink-700 animate-pulse", icon: Send },
            "Not Approved": { color: "bg-gray-100 text-gray-500 border border-dashed border-gray-300", icon: Calendar }
        };

        const variant = variants[status] || variants.Pending;
        const Icon = variant.icon;

        return (
            <Badge variant="secondary" className={`${variant.color} flex items-center gap-1 border-none font-bold`}>
                <Icon className="w-3 h-3" />
                {status}
            </Badge>
        );
    };

    const sidebarItems = [
        { id: "overview", label: "Overview", icon: User },
        { id: "orders", label: "My Orders", icon: ShoppingBag },
        { id: "addresses", label: "Saved Addresses", icon: MapPin },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#fffafa]">
            <Navbar />

            <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
                {loading ? (
                    <div className="max-w-md mx-auto mt-10">
                        <Card className="shadow-2xl border-none bg-white/80 backdrop-blur-md">
                            <CardContent className="py-12 text-center text-gray-500">
                                Restoring your session...
                            </CardContent>
                        </Card>
                    </div>
                ) : !isLoggedIn ? (
                    <div className="max-w-md mx-auto mt-10">
                        <Card className="shadow-2xl border-none bg-white/80 backdrop-blur-md">
                            <CardHeader className="text-center pb-8 border-b border-pink-50">
                                <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-12">
                                    <ShoppingBag className="w-8 h-8 text-pink-500 transform -rotate-12" />
                                </div>
                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                                    {authStep === "email" && "Track Your Journey"}
                                    {authStep === "login" && "Welcome Back"}
                                    {authStep === "register" && "Create Your Account"}
                                    {authStep === "setPassword" && "Set Your Password"}
                                </CardTitle>
                                <CardDescription className="text-gray-500 mt-2">
                                    {authStep === "email" && "Enter your email to continue"}
                                    {authStep === "login" && "Enter your password to access your profile"}
                                    {authStep === "register" && "Fill in your details to create an account"}
                                    {authStep === "setPassword" && "Create a password to secure your account"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8 space-y-6">
                                {authStep === "email" && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="your@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-12 text-lg rounded-xl border-gray-200 focus:ring-pink-500"
                                            />
                                        </div>
                                        <Button
                                            className="w-full h-12 text-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-pink-200"
                                            onClick={handleCheckEmail}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? "Checking..." : "Continue"}
                                        </Button>
                                    </div>
                                )}

                                {authStep === "login" && (
                                    <div className="space-y-4">
                                        <div className="rounded-lg bg-pink-50 px-4 py-2 text-sm text-gray-600">
                                            {email}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</Label>
                                            <Input
                                                type="password"
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e) => setPasswordInput(e.target.value)}
                                                className="h-12 text-lg rounded-xl border-gray-200 focus:ring-pink-500"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setForgotPasswordEmail(email); setForgotPasswordOpen(true); }}
                                            className="text-sm text-pink-600 hover:text-pink-700 hover:underline w-full text-left"
                                        >
                                            Forgot password?
                                        </button>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={handleBackToEmail}
                                                disabled={loading}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                                onClick={handleLoginClick}
                                                disabled={loading}
                                            >
                                                {loading ? "Logging in..." : "Login"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {authStep === "register" && (
                                    <form onSubmit={handleRegister} className="space-y-4">
                                        <div className="rounded-lg bg-pink-50 px-4 py-2 text-sm text-gray-600">
                                            {email}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name *</Label>
                                            <Input
                                                placeholder="Your full name"
                                                value={registerForm.name}
                                                onChange={(e) => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                                                className="h-12 rounded-xl border-gray-200 focus:ring-pink-500"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number *</Label>
                                            <Input
                                                type="tel"
                                                placeholder="e.g. 9876543210"
                                                value={registerForm.phone}
                                                onChange={(e) => setRegisterForm(f => ({ ...f, phone: e.target.value }))}
                                                className="h-12 rounded-xl border-gray-200 focus:ring-pink-500"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Age *</Label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 28"
                                                value={registerForm.age}
                                                onChange={(e) => setRegisterForm(f => ({ ...f, age: e.target.value }))}
                                                className="h-12 rounded-xl border-gray-200 focus:ring-pink-500"
                                                min={1}
                                                max={120}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Gender</Label>
                                            <select
                                                value={registerForm.gender}
                                                onChange={(e) => setRegisterForm(f => ({ ...f, gender: e.target.value }))}
                                                className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-base focus:ring-2 focus:ring-pink-500"
                                            >
                                                <option value="">Select gender</option>
                                                <option value="female">Female</option>
                                                <option value="male">Male</option>
                                                <option value="other">Other</option>
                                                <option value="prefer_not_to_say">Prefer not to say</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password *</Label>
                                            <Input
                                                type="password"
                                                placeholder="At least 6 characters"
                                                value={password}
                                                onChange={(e) => setPasswordInput(e.target.value)}
                                                className="h-12 rounded-xl border-gray-200 focus:ring-pink-500"
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm Password *</Label>
                                            <Input
                                                type="password"
                                                placeholder="Re-enter password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="h-12 rounded-xl border-gray-200 focus:ring-pink-500"
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={handleBackToEmail}
                                                disabled={loading}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                                disabled={loading}
                                            >
                                                {loading ? "Creating..." : "Create Account"}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {authStep === "setPassword" && (
                                    <form onSubmit={handleSetPassword} className="space-y-4">
                                        <div className="rounded-lg bg-pink-50 px-4 py-2 text-sm text-gray-600">
                                            {email}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</Label>
                                            <Input
                                                type="password"
                                                placeholder="At least 6 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="h-12 text-lg rounded-xl border-gray-200 focus:ring-pink-500"
                                                minLength={6}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm Password</Label>
                                            <Input
                                                type="password"
                                                placeholder="Re-enter password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="h-12 text-lg rounded-xl border-gray-200 focus:ring-pink-500"
                                                minLength={6}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => setAuthStep("login")}
                                                disabled={loading}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                                disabled={loading}
                                            >
                                                {loading ? "Setting..." : "Set Password & Login"}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Forgot Password</DialogTitle>
                                    <DialogDescription>
                                        Enter your email and we&apos;ll send you a link to reset your password.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={forgotPasswordEmail}
                                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                            className="h-12"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setForgotPasswordOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isProcessing}>
                                            {isProcessing ? "Sending..." : "Send Reset Link"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="w-full md:w-64 space-y-2">
                            <div className="bg-white rounded-3xl p-6 shadow-xl border border-pink-50 mb-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        {customer?.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{customer?.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter truncate font-mono">{customer?.phone || customer?.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {sidebarItems.map((item) => {
                                        const Icon = item.icon;
                                        const hasRequested = item.id === "orders" && orders.some(o => o.orderStatus === 'Requested');
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => { setSearchParams({ tab: item.id }); }}

                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${activeTab === item.id
                                                    ? "bg-pink-500 text-white shadow-lg shadow-pink-100"
                                                    : "text-gray-500 hover:bg-pink-50 hover:text-pink-600"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className="w-4 h-4" />
                                                    {item.label}
                                                </div>
                                                {hasRequested && (
                                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-sm"></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => {
                                            logout();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-400 hover:bg-red-50 transition-all mt-4"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 min-w-0">
                            {/* Overview Tab */}
                            {activeTab === "overview" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <Card className="border-none shadow-lg bg-white overflow-hidden group">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                                                        <ShoppingBag className="w-5 h-5 text-pink-500" />
                                                    </div>
                                                    <Badge className="bg-pink-50 text-pink-600 border-none">Total</Badge>
                                                </div>
                                                <p className="text-3xl font-black text-gray-900">{orders.length}</p>
                                                <p className="text-sm text-gray-500 font-medium">Orders Placed</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-none shadow-lg bg-white overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-purple-500" />
                                                    </div>
                                                </div>
                                                <p className="text-xl font-black text-gray-900">
                                                    {formatDate(customer?.createdAt)}
                                                </p>
                                                <p className="text-sm text-gray-500 font-medium">Wellness Journey Started</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Action Required: Requested Orders */}
                                    {orders.some(o => o.orderStatus === 'Requested') && (
                                        <Card className="border-none shadow-xl bg-yellow-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="bg-yellow-400 h-1.5 w-full"></div>
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-black text-gray-900 leading-tight">Action Required!</h3>
                                                        <p className="text-sm text-gray-600">You have order requests awaiting your confirmation.</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => setSearchParams({ tab: "orders" })}
                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl"
                                                    >
                                                        Review Now
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Last Order Status Card (NOW FIRST) */}
                                    {orders.length > 0 && (() => {
                                        const displayOrder = orders.find(o => o.orderStatus === 'Requested') || orders.find(o => ['Confirmed', 'Processing', 'Shipped'].includes(o.orderStatus)) || orders[0];
                                        return (
                                            <Card className="border-none shadow-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-bold flex items-center gap-2 opacity-90 uppercase tracking-wider">
                                                        <Truck className="w-4 h-4" /> Last Order Status
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div>
                                                            <p className="text-4xl font-black mb-1">{displayOrder.orderStatus}</p>
                                                            <p className="text-white/80 text-xs font-bold font-mono">#{displayOrder.orderId || displayOrder._id.slice(-6).toUpperCase()} • {displayOrder.phase}</p>
                                                        </div>
                                                        <Button
                                                            onClick={() => { setSearchParams({ tab: "orders", order: displayOrder._id }); }}
                                                            variant="secondary"
                                                            className="bg-white text-pink-600 hover:bg-gray-100 font-bold shadow-lg"
                                                        >
                                                            Track Order
                                                        </Button>
                                                    </div>

                                                    <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-8">
                                                        {displayOrder.deliveryDate && (
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-white/20 p-2.5 rounded-xl">
                                                                    <Calendar className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-white/70 uppercase font-black tracking-widest mb-0.5">Expected Delivery</p>
                                                                    <p className="font-bold text-sm md:text-base">{formatDate(displayOrder.deliveryDate)}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-white/20 p-2.5 rounded-xl">
                                                                <Package className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-white/70 uppercase font-black tracking-widest mb-0.5">Order Day</p>
                                                                <p className="font-bold text-sm md:text-base">
                                                                    {formatDate(displayOrder.createdAt)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })()}

                                    {/* My Subscription Card (NOW SECOND) */}
                                    <Card className="border-none shadow-xl bg-white overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                                        <div className={`absolute top-0 left-0 w-2 h-full ${customer?.subscriptionStatus === 'active' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                        <span className="text-xl">☀️</span> My Subscription
                                                    </CardTitle>
                                                    <CardDescription>Track your active cycle plan</CardDescription>
                                                </div>
                                                <Badge className={`${customer?.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} border-none font-bold uppercase tracking-wider text-[10px]`}>
                                                    {customer?.subscriptionStatus || 'No Active Plan'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="flex items-center gap-4 bg-pink-50/50 p-4 rounded-2xl border border-pink-100">
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">
                                                    {customer?.planType === 'complete' ? '🌼' : '🌸'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 leading-tight">
                                                        {customer?.planType === 'complete' ? 'Complete Balance Plan' : (customer?.planType === 'starter' ? 'Cycle Starter Plan' : 'No Plan Selected')}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        {customer?.planType === 'complete' ? 'Auto-delivery for both phases' : 'One-time phase delivery'}
                                                    </p>
                                                </div>
                                            </div>

                                            {customer?.planType && (
                                                <div className="space-y-4">
                                                    {customer.planType === 'starter' && (
                                                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 flex items-center gap-2">Upgrade to Complete Balance ✨</h4>
                                                                <p className="text-xs text-gray-500 mt-1">Subscribe now to get both Phase 1 & 2 laddus delivered automatically every cycle.</p>
                                                            </div>
                                                            <Button onClick={handleUpgradePlan} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700 text-white font-bold whitespace-nowrap shadow-md shadow-purple-200 shrink-0">
                                                                {isProcessing ? "Upgrading..." : "Upgrade Plan"}
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {customer.planType === 'complete' && customer.nextDeliveryDate && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Delivery</p>
                                                                <div className="flex items-center gap-2 text-gray-900">
                                                                    <Calendar className="w-4 h-4" />
                                                                    <span className="font-bold">{formatDate(customer.nextDeliveryDate)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deliver in</p>
                                                                <div className="flex items-center gap-2 text-pink-600 font-black">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span>{Math.ceil((new Date(customer.nextDeliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Orders Tab */}
                            {activeTab === "orders" && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {selectedOrder ? "Order Tracking" : "Your Order History"}
                                        </h2>
                                        {selectedOrder && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSearchParams({ tab: "orders" })}
                                                className="text-pink-600 border-pink-200 hover:bg-pink-50 flex items-center gap-2 font-bold"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                Back to List
                                            </Button>
                                        )}
                                    </div>

                                    {selectedOrder ? (
                                        <div className="space-y-6">
                                            <Card className="border-none shadow-xl bg-white overflow-hidden">
                                                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-white">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Tracking Order</p>
                                                            <h3 className="text-3xl font-black">#{selectedOrder.orderId || selectedOrder._id.slice(-6).toUpperCase()}</h3>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge className="bg-white/20 text-white border-none py-1 px-3">
                                                                {selectedOrder.orderStatus}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <CardContent className="p-8">
                                                    {renderTrackingTimeline(selectedOrder.orderStatus)}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-100">
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Estimated Delivery</h4>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                                                                    <Truck className="w-6 h-6 text-green-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900 text-lg">
                                                                        {selectedOrder.deliveryDate ? formatDate(selectedOrder.deliveryDate) : "Calculation pending..."}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">Subject to logistics partners</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Shipping To</h4>
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center">
                                                                    <MapPin className="w-6 h-6 text-pink-600" />
                                                                </div>
                                                                <div className="text-sm text-gray-600 leading-relaxed">
                                                                    <p className="font-bold text-gray-900 uppercase">{selectedOrder.fullName}</p>
                                                                    <p>{selectedOrder.address.house}, {selectedOrder.address.area}</p>
                                                                    <p>{selectedOrder.address.pincode}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ) : (
                                        <>
                                            {orders.length === 0 ? (
                                                <Card className="border-dashed border-2 py-20 text-center">
                                                    <CardDescription>You haven't placed any orders yet.</CardDescription>
                                                    <Button variant="link" className="text-pink-600" onClick={() => window.location.href = '/shop'}>Start Shopping</Button>
                                                </Card>
                                            ) : (
                                                orders.map((order) => (
                                                    <Card key={order._id} className="border-none shadow-lg bg-white overflow-hidden hover:shadow-xl transition-all mb-4">
                                                        <div className="p-6">
                                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                                                                        <Package className="w-6 h-6 text-gray-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-800">Order #{order.orderId || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'N/A')}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatDate(order.createdAt)}
                                                            </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-right">
                                                                        <p className="text-xl font-black text-gray-900">Total Price:₹{order.totalPrice}</p>
                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Quantity:{order.totalQuantity} Laddus</p>
                                                                    </div>
                                                                    <Button size="sm" variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50" onClick={() => setSearchParams({ tab: "orders", order: order._id })}>Details</Button>
                                                                    {order.orderStatus === 'Requested' && (
                                                                        <Button
                                                                            size="sm"
                                                                            className="bg-pink-500 hover:bg-pink-600 text-white font-bold"
                                                                            onClick={(e) => { e.stopPropagation(); navigate(`/confirm-order/${order._id}`); }}
                                                                        >
                                                                            Confirm Now
                                                                        </Button>
                                                                    )}
                                                                    {getStatusBadge(order.orderStatus)}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 rounded-2xl p-4 border border-gray-50">
                                                                <div>
                                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order Details</h4>
                                                                    <div className="space-y-1 text-sm">
                                                                        <p className="text-gray-700 font-bold">{order.totalQuantity} {order.phase} Healthy Laddus</p>
                                                                        <p className="text-gray-500 text-xs font-medium">{order.totalWeight || (order.totalQuantity * 30)}g • {order.cycleLength} Day Cycle</p>
                                                                        {order.deliveryDate && (
                                                                            <div className="flex items-center gap-1.5 text-green-600 font-bold mt-1">
                                                                                <Truck className="w-3 h-3" />
                                                                                <span className="text-[10px]">Expected: {formatDate(order.deliveryDate)}</span>
                                                                            </div>
                                                                        )}
                                                                        {order.paymentMethod && (
                                                                            <p className="text-pink-600 text-xs font-bold mt-2">Paid via {order.paymentMethod}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ship to</h4>
                                                                    <address className="not-italic text-sm text-gray-600 leading-relaxed">
                                                                        {order.address.house}, {order.address.area}<br />
                                                                        {order.address.pincode}
                                                                    </address>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Addresses Tab */}
                            {activeTab === "addresses" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h2 className="text-2xl font-bold text-gray-800">Saved Addresses</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {customer?.addresses && customer.addresses.length > 0 ? (
                                            customer.addresses.map((addr: any, idx: number) => (
                                                <Card key={idx} className="border-none shadow-lg bg-white overflow-hidden group">
                                                    <CardContent className="p-6">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                                                                <MapPin className="w-5 h-5 text-pink-500" />
                                                            </div>
                                                            <Badge variant="secondary" className="bg-gray-50 text-gray-500 border-none">{addr.label || 'Other'}</Badge>
                                                        </div>
                                                        <h4 className="font-bold text-gray-900 mb-1">{addr.label || 'Home'}</h4>
                                                        <p className="text-sm text-gray-600 leading-relaxed h-10 overflow-hidden line-clamp-2">
                                                            {addr.house}, {addr.area}, {addr.pincode}
                                                        </p>
                                                        <div className="mt-6 flex justify-end gap-2">
                                                            <Button size="sm" variant="ghost" className="text-pink-600 font-bold hover:bg-pink-50">Manage</Button>
                                                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteAddress(idx)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        ) : (
                                            orders.length > 0 && orders[0].address && (
                                                <Card className="border-none shadow-lg bg-white overflow-hidden group">
                                                    <CardContent className="p-6">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                                                                <MapPin className="w-5 h-5 text-pink-500" />
                                                            </div>
                                                            <Badge variant="secondary" className="bg-gray-50 text-gray-500 border-none">Default</Badge>
                                                        </div>
                                                        <h4 className="font-bold text-gray-900 mb-1">Primary Address</h4>
                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                            {orders[0].address.house}, {orders[0].address.area}, {orders[0].address.pincode}
                                                        </p>
                                                        <div className="mt-6 flex justify-end">
                                                            <p className="text-[10px] text-gray-400 font-bold italic">Auto-saved from last order</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        )}
                                        <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
                                            <DialogTrigger asChild>
                                                <Card className="border-dashed border-2 bg-transparent hover:bg-pink-50/20 transition-all cursor-pointer flex flex-col items-center justify-center p-8">
                                                    <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mb-3 text-pink-400">
                                                        <Plus className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-400">Add New Address</p>
                                                </Card>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Add New Address</DialogTitle>
                                                    <DialogDescription>
                                                        Save a new delivery location to your profile.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <form onSubmit={handleNewAddress} className="space-y-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label>House / Flat No.</Label>
                                                        <Input
                                                            value={newAddress.house}
                                                            onChange={e => setNewAddress({ ...newAddress, house: e.target.value })}
                                                            placeholder="Flat 101, Galaxy Apts"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Area / Street</Label>
                                                        <Input
                                                            value={newAddress.area}
                                                            onChange={e => setNewAddress({ ...newAddress, area: e.target.value })}
                                                            placeholder="Green Park, Church Road"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label>Pincode</Label>
                                                            <Input
                                                                value={newAddress.pincode}
                                                                onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                                                placeholder="500001"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label>Address Type</Label>
                                                            <select
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                value={newAddress.label}
                                                                onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                                            >
                                                                <option>Home</option>
                                                                <option>Work</option>
                                                                <option>Other</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white w-full h-12" disabled={isProcessing}>
                                                            {isProcessing ? "Saving..." : "Save Address"}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === "settings" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
                                    <Card className="border-none shadow-lg bg-white">
                                        <CardContent className="p-8 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-gray-500">Full Name</Label>
                                                    <Input value={customer?.name} disabled className="bg-gray-50 border-none rounded-xl h-12" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-500">Phone Number</Label>
                                                    <Input value={customer?.phone} disabled className="bg-gray-50 border-none rounded-xl h-12" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-gray-500">Email Address</Label>
                                                    <Input value={customer?.email || 'Not connected'} disabled className="bg-gray-50 border-none rounded-xl h-12" />
                                                </div>
                                                <div className="space-y-2 text-right flex flex-col justify-end">
                                                    <Button variant="outline" className="h-12 border-pink-100 text-pink-600 hover:bg-pink-50 rounded-xl font-bold">Request Update</Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </main>
                    </div>
                )}
            </div>
        </div>
    );
}
