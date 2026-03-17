import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Lock, ArrowLeft } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error("Invalid reset link");
            navigate("/profile");
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/customer-reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                toast.success("Password reset successfully! You can now login.");
                setTimeout(() => navigate("/profile"), 2000);
            } else {
                toast.error(data.message || "Failed to reset password");
            }
        } catch (err) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen bg-[#fffafa]">
            <Navbar />
            <div className="container mx-auto px-4 py-8 pt-24 max-w-md">
                <Card className="shadow-2xl border-none bg-white/80 backdrop-blur-md">
                    <CardHeader className="text-center pb-8 border-b border-pink-50">
                        <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-pink-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                            {success ? "Password Reset!" : "Set New Password"}
                        </CardTitle>
                        <CardDescription className="text-gray-500 mt-2">
                            {success
                                ? "Redirecting you to login..."
                                : "Enter your new password below. It must be at least 6 characters."}
                        </CardDescription>
                    </CardHeader>
                    {!success && (
                        <CardContent className="pt-8">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="At least 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 rounded-xl"
                                        minLength={6}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="h-12 rounded-xl"
                                        minLength={6}
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                    disabled={loading}
                                >
                                    {loading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        </CardContent>
                    )}
                </Card>
                <Button
                    variant="ghost"
                    className="mt-4 w-full gap-2"
                    onClick={() => navigate("/profile")}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Profile
                </Button>
            </div>
        </div>
    );
}
