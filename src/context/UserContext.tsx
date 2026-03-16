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

interface UserContextType {
    customer: Customer | null;
    isLoggedIn: boolean;
    loading: boolean;
    login: (identity: string) => Promise<void>;
    logout: () => void;
    updateCustomerData: (data: Partial<Customer>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedIdentity = localStorage.getItem("cycle_harmony_user_identity");
        if (savedIdentity) {
            handleAutoLogin(savedIdentity);
        }
    }, []);

    const handleAutoLogin = async (identity: string) => {
        setLoading(true);
        try {
            const isEmail = identity.includes("@");
            const url = isEmail
                ? `/api/customer-profile-by-email/${encodeURIComponent(identity)}`
                : `/api/customer-profile/${identity}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setCustomer(data.customer);
                setIsLoggedIn(true);
            } else {
                localStorage.removeItem("cycle_harmony_user_identity");
            }
        } catch (error) {
            console.error("Auto-login error:", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (identity: string) => {
        setLoading(true);
        try {
            const isEmail = identity.includes("@");
            const url = isEmail
                ? `/api/customer-profile-by-email/${encodeURIComponent(identity)}`
                : `/api/customer-profile/${identity}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setCustomer(data.customer);
                setIsLoggedIn(true);
                localStorage.setItem("cycle_harmony_user_identity", identity);
                toast.success(`Welcome back, ${data.customer.name}!`);
            } else {
                toast.error("Customer not found");
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Failed to login");
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setCustomer(null);
        setIsLoggedIn(false);
        localStorage.removeItem("cycle_harmony_user_identity");
        toast.info("Logged out successfully");
    };

    const updateCustomerData = (data: Partial<Customer>) => {
        if (customer) {
            setCustomer({ ...customer, ...data });
        }
    };

    return (
        <UserContext.Provider value={{ customer, isLoggedIn, loading, login, logout, updateCustomerData }}>
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
