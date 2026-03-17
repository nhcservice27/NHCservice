import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface Address {
    house: string;
    area: string;
    landmark?: string;
    pincode: string;
    mapLink?: string;
    label: "Home" | "Work" | "Other";
}

interface Customer {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    addresses: Address[];
    createdAt: string;
    planType?: 'starter' | 'complete';
    subscriptionStatus?: 'active' | 'paused' | 'inactive';
    nextDeliveryDate?: string;
    shippingDate?: string;
    autoPhase2?: boolean;
    lastPeriodDate?: string;
    averageCycleLength?: number;
}

interface LoginResult {
    success: boolean;
    needsPasswordSetup?: boolean;
    identity?: string;
    customer?: Customer;
}

interface RegisterData {
    email: string;
    name: string;
    phone: string;
    age: number;
    gender?: string;
    password: string;
}

interface UserContextType {
    customer: Customer | null;
    isLoggedIn: boolean;
    loading: boolean;
    login: (identity: string, password: string) => Promise<LoginResult>;
    register: (data: RegisterData) => Promise<{ success: boolean }>;
    setPassword: (identity: string, password: string) => Promise<{ success: boolean }>;
    logout: () => Promise<void>;
    updateCustomerData: (data: Partial<Customer>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const CUSTOMER_TOKEN_KEY = "cycle_harmony_customer_token";

const getCustomerAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const apiBase = import.meta.env.VITE_API_URL || "/api";
                const response = await fetch(`${apiBase}/customer-session`, {
                    credentials: "include",
                    headers: getCustomerAuthHeaders(),
                });

                if (!response.ok) {
                    setCustomer(null);
                    setIsLoggedIn(false);
                    return;
                }

                const data = await response.json();
                if (data.success && data.customer) {
                    setCustomer(data.customer);
                    setIsLoggedIn(true);
                    if (data.customer.email) {
                        localStorage.setItem("cycle_harmony_user_identity", data.customer.email);
                    } else if (data.customer.phone) {
                        localStorage.setItem("cycle_harmony_user_identity", data.customer.phone);
                    }
                    if (data.token) {
                        localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
                    }
                }
            } catch (error) {
                console.error("Restore session error:", error);
                setCustomer(null);
                setIsLoggedIn(false);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (identity: string, password: string): Promise<LoginResult> => {
        setLoading(true);
        try {
            const apiBase = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(`${apiBase}/customer-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ identity: identity.trim(), password }),
            });
            const data = await response.json();

            if (data.success) {
                setCustomer(data.customer);
                setIsLoggedIn(true);
                localStorage.setItem("cycle_harmony_user_identity", identity.trim());
                if (data.token) {
                    localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
                }
                toast.success(`Welcome back, ${data.customer.name}!`);
                return { success: true, customer: data.customer };
            }

            if (data.needsPasswordSetup) {
                return { success: false, needsPasswordSetup: true, identity: data.identity };
            }

            toast.error(data.message || "Invalid email, phone, or password");
            return { success: false };
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Failed to login");
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        const apiBase = import.meta.env.VITE_API_URL || "/api";

        try {
            await fetch(`${apiBase}/customer-logout`, {
                method: "POST",
                credentials: "include",
                headers: getCustomerAuthHeaders(),
            });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setCustomer(null);
            setIsLoggedIn(false);
            localStorage.removeItem("cycle_harmony_user_identity");
            localStorage.removeItem(CUSTOMER_TOKEN_KEY);
            toast.info("Logged out successfully");
        }
    };

    const register = async (data: RegisterData): Promise<{ success: boolean }> => {
        setLoading(true);
        try {
            const apiBase = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(`${apiBase}/customers/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            const res = await response.json();

            if (res.success) {
                setCustomer(res.customer);
                setIsLoggedIn(true);
                localStorage.setItem("cycle_harmony_user_identity", data.email.trim());
                if (res.token) {
                    localStorage.setItem(CUSTOMER_TOKEN_KEY, res.token);
                }
                toast.success(`Welcome, ${res.customer.name}! Your account has been created.`);
                return { success: true };
            }
            toast.error(res.message || "Registration failed");
            return { success: false };
        } catch (error) {
            console.error("Register error:", error);
            toast.error("Failed to create account");
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    const setPassword = async (identity: string, password: string): Promise<{ success: boolean }> => {
        setLoading(true);
        try {
            const apiBase = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(`${apiBase}/customer-set-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ identity: identity.trim(), password }),
            });
            const data = await response.json();

            if (data.success) {
                setCustomer(data.customer);
                setIsLoggedIn(true);
                localStorage.setItem("cycle_harmony_user_identity", identity.trim());
                if (data.token) {
                    localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
                }
                toast.success("Password set! Welcome to your profile.");
                return { success: true };
            }
            toast.error(data.message || "Failed to set password");
            return { success: false };
        } catch (error) {
            console.error("Set password error:", error);
            toast.error("Failed to set password");
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    const updateCustomerData = (data: Partial<Customer>) => {
        if (customer) {
            setCustomer({ ...customer, ...data });
        }
    };

    return (
        <UserContext.Provider value={{ customer, isLoggedIn, loading, login, register, logout, setPassword, updateCustomerData }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
