import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-nhc.jpg";
import { User, Search, Menu, X } from "lucide-react";
import { useUser } from "@/context/UserContext";

export function Navbar() {
    const { customer, isLoggedIn } = useUser();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: "/shop", label: "Shop Now" },
        { href: "/about", label: "Our Story" },
        { href: "/contact", label: "Support" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 transition-all duration-500">
            <div className="container mx-auto max-w-7xl">
                <div className="glass-card flex justify-between items-center px-6 py-3 md:py-4 rounded-full border-white/50 backdrop-blur-xl shadow-premium">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group transition-transform hover:scale-105">
                        <img
                            src={logo}
                            alt="NHC Natural Health Care"
                            className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-full shadow-sm ring-2 ring-white/80"
                        />
                        <span className="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight hidden sm:block">
                            Cycle Harmony
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                to={link.href}
                                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-all duration-300 relative group"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                        ))}
                    </div>

                    {/* Right Action Icons */}
                    <div className="flex items-center gap-3 md:gap-5">
                        {/* Search button - Premium style */}
                        <button
                            className="p-2.5 rounded-full hover:bg-black/5 transition-all text-foreground/70 hover:text-foreground"
                            aria-label="Search"
                        >
                            <Search className="h-5 w-5" />
                        </button>

                        {/* Profile action */}
                        <Link
                            to="/profile"
                            className="flex items-center gap-2 group p-1 pr-3 rounded-full hover:bg-black/5 transition-all"
                        >
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/20 text-primary-foreground shadow-sm group-hover:bg-primary/30 transition-colors">
                                <User className="h-5 w-5 text-wellness-green" />
                            </div>
                            <div className="hidden lg:flex flex-col items-start leading-none">
                                <span className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold mb-0.5">Account</span>
                                <span className="text-xs font-bold text-foreground">
                                    {isLoggedIn && customer ? customer.name.split(' ')[0] : "Login"}
                                </span>
                            </div>
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 rounded-full hover:bg-black/5 text-foreground"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown */}
                <div className={`
                    md:hidden absolute top-full left-4 right-4 mt-2 transition-all duration-500 transform
                    ${mobileMenuOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-4 opacity-0 pointer-events-none"}
                `}>
                    <div className="glass-card rounded-[2rem] p-6 shadow-premium border-white/50 backdrop-blur-2xl">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    to={link.href}
                                    className="text-lg font-medium text-foreground p-4 rounded-2xl hover:bg-primary/10 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
