import { Facebook, Instagram, Mail, Phone, MapPin, Check } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-nhc.jpg";

export function Footer() {
    const currentYear = new Date().getFullYear();
    const phoneNumber = "919347122416";
    const email = "nhccycleharmony@gmail.com";

    const handleWhatsAppClick = () => {
        window.open(`https://wa.me/${phoneNumber}`, "_blank");
    };

    return (
        <footer className="relative pt-24 pb-12 overflow-hidden mt-12 bg-white/50 backdrop-blur-xl border-t border-white/50">
            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">

                    {/* Brand Column */}
                    <div className="md:col-span-4 space-y-8">
                        <div className="flex flex-col gap-4">
                            <h3 className="font-heading font-bold text-3xl text-foreground tracking-tight">Cycle Harmony</h3>
                            <p className="text-foreground/70 leading-relaxed font-body text-sm max-w-xs">
                                Natural hormone balancing through the ancient power of seed cycling. Handcrafted with love for modern wellness.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-primary transition-all text-foreground hover:text-primary-foreground transform hover:-translate-y-1">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-primary transition-all text-foreground hover:text-primary-foreground transform hover:-translate-y-1">
                                <Facebook className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="md:col-span-2 space-y-6">
                        <h4 className="font-heading font-bold text-lg text-foreground">Explore</h4>
                        <ul className="space-y-4">
                            {["Shop Now", "Our Story", "Cycles", "Benefits"].map((item) => (
                                <li key={item}>
                                    <Link to={`/${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-foreground/60 hover:text-foreground transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="md:col-span-2 space-y-6">
                        <h4 className="font-heading font-bold text-lg text-foreground">Legal</h4>
                        <ul className="space-y-4">
                            {["Privacy Policy", "Terms & Conditions", "Shipping", "Refunds"].map((item) => (
                                <li key={item}>
                                    <Link to={`/${item.toLowerCase().replace(' & ', '-').replace(' ', '-')}`} className="text-sm text-foreground/60 hover:text-foreground transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="md:col-span-4 space-y-8">
                        <h4 className="font-heading font-bold text-lg text-foreground">Stay Connected</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-foreground/5 border border-white/40 transition-all hover:bg-foreground/10 group">
                                <Mail className="h-5 w-5 text-wellness-green mt-0.5" />
                                <div className="overflow-hidden">
                                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mb-1">Email Support</p>
                                    <p className="font-medium text-foreground text-sm truncate">{email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-foreground/5 border border-white/40 transition-all hover:bg-foreground/10 group">
                                <MapPin className="h-5 w-5 text-wellness-green mt-0.5" />
                                <div className="overflow-hidden">
                                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mb-1">Service Area</p>
                                    <p className="font-medium text-foreground text-sm">Greater Hyderabad, IN</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-foreground/10 flex flex-col md:flex-row justify-between items-center gap-6 text-foreground/40 text-xs font-medium">
                    <p>© {currentYear} NHC Natural Health Care. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2">
                             Secure Payment <Check className="h-3 w-3" />
                        </span>
                        <span className="flex items-center gap-2">
                             Lab Tested <Check className="h-3 w-3" />
                        </span>
                    </div>
                </div>
            </div>

            {/* Premium WhatsApp Button */}
            <button
                onClick={handleWhatsAppClick}
                className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-5 rounded-full shadow-premium transition-all hover:scale-110 hover:-rotate-6 active:scale-95 group"
                aria-label="Chat on WhatsApp"
            >
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping opacity-20"></div>
                <Instagram className="h-6 w-6 relative z-10" /> {/* Using Instagram as placeholder icon if WhatsApp SVG is missing, but better use a real one or Lucide */}
                {/* Re-adding WhatsApp SVG for consistency */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    className="h-6 w-6 relative z-10"
                >
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                </svg>
            </button>
        </footer>
    );
}
