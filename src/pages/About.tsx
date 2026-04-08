import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeIn } from "@/components/FadeIn";
import { Leaf, Heart, Target, Sparkles, CheckCircle2, Phone, Mail, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-nhc.jpg";
import heroImage from "@/assets/botanical-hero.png";

export default function About() {
    useEffect(() => {
        document.title = "About Our Journey | NHC Natural Health Care Services";
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute("content", "Discover the story of NHC Natural Health Care Services. We empower women with premium seed cycling solutions for hormonal balance, PCOS, and overall wellness.");
        }
        window.scrollTo(0, 0);
    }, []);

    const values = [
        { icon: Leaf, title: "Purely Natural", desc: "Crafted with 100% whole, raw seeds. No additives, no preservatives, just nature's design." },
        { icon: Heart, title: "Hormonal Harmony", desc: "Designed to align with your cycle's phases, supporting your body's natural rhythms." },
        { icon: Target, title: "Precision Crafted", desc: "Each laddu contains the exact daily dose of specific seeds to optimize Phase 1 and Phase 2 efficacy." },
        { icon: Sparkles, title: "Wellness Elevated", desc: "Healthy living should be easy and delicious. Our premium laddus make seed cycling a joy." },
    ];

    const highlights = [
        "Clinically Thoughtful Formula",
        "Raw, Sprouted Seed Nutrition",
        "Zero Processed Sugars",
        "Ayurvedic-Inspired Wisdom",
        "Handcrafted with Care",
        "Hyderabad's Trusted Choice",
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main>
                {/* --- Hero Section: Botanical Elegance --- */}
                <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden bg-wellness-forest">
                    {/* Background Layer */}
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={heroImage} 
                            alt="Botanical Hero" 
                            className="w-full h-full object-cover opacity-30 mix-blend-soft-light"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-wellness-forest/80 via-wellness-forest/90 to-wellness-forest" />
                    </div>

                    <div className="container mx-auto px-4 max-w-6xl relative z-10">
                        <FadeIn>
                            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                                <div className="mb-8 p-3 rounded-full glass-green inline-block">
                                    <img src={logo} alt="NHC" className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-2xl" />
                                </div>
                                <span className="text-wellness-green-light font-bold tracking-[0.2em] uppercase text-xs md:text-sm mb-6 block">
                                    Our Story & Philosophy
                                </span>
                                <h1 className="font-heading text-4xl md:text-7xl font-bold text-white mb-8 leading-[1.1]">
                                    Cultivating <span className="text-secondary">Balance</span> through Nature's Wisdom
                                </h1>
                                <p className="text-lg md:text-xl text-white/80 leading-relaxed font-light max-w-2xl mb-10">
                                    We believe that hormonal wellness shouldn't be complicated. By honoring your body's natural cycle, we help you achieve vibrant health, one seed at a time.
                                </p>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <Link 
                                        to="/shop" 
                                        className="px-8 py-4 bg-white text-wellness-forest rounded-xl font-bold hover:bg-wellness-green-light transition-all flex items-center gap-2 group"
                                    >
                                        Explore Our Plans <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <a 
                                        href="#mission" 
                                        className="px-8 py-4 glass-green text-white rounded-xl font-bold hover:bg-white/10 transition-all border border-white/20"
                                    >
                                        Our Philosophy
                                    </a>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* --- Mission Section: The Origin --- */}
                <section id="mission" className="py-24 md:py-32 mesh-bg-green">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <div className="grid md:grid-cols-12 gap-12 items-center">
                            <div className="md:col-span-12">
                                <FadeIn>
                                    <div className="max-w-3xl">
                                        <h2 className="font-heading text-3xl md:text-5xl font-bold text-wellness-forest mb-10 leading-tight">
                                            Born from a simple need: <br/>Natural solutions for modern women.
                                        </h2>
                                        <div className="space-y-8 text-wellness-forest/80 text-lg md:text-xl leading-[1.7] font-light">
                                            <p>
                                                <strong>NHC Natural Health Care Services</strong> was founded on the principle that the most effective health interventions are often those that work in harmony with our biology.
                                            </p>
                                            <p>
                                                In an era of synthetic quick-fixes, we saw too many women navigating PCOS, PCOD, and PMS without sustainable, natural support. We looked back at traditional wisdom and nutritional science to rediscover <strong>Seed Cycling</strong> — a transformative practice that uses the raw power of nutritional seeds to balance hormones naturally.
                                            </p>
                                            <div className="p-8 rounded-3xl glass-green border-wellness-green/20 border">
                                                <p className="italic text-wellness-forest/90 font-medium">
                                                    "Our mission is to empower women with the tools to take control of their hormonal health through evidence-based nutrition that is both delicious and effortless to maintain."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- What We Do: The Method --- */}
                <section className="py-24 md:py-32 bg-white">
                    <div className="container mx-auto px-4 max-w-6xl text-center mb-16">
                        <FadeIn>
                            <span className="text-wellness-green font-bold tracking-[0.1em] uppercase text-xs mb-4 block">The Science of Seeds</span>
                            <h2 className="font-heading text-3xl md:text-5xl font-bold text-wellness-forest mb-6">How It Works</h2>
                            <p className="text-gray-500 max-w-2xl mx-auto">Different seeds for different phases. A precise methodology to support your body's specific needs at the right time.</p>
                        </FadeIn>
                    </div>

                    <div className="container mx-auto px-4 max-w-5xl">
                        <div className="grid md:grid-cols-2 gap-8">
                            <FadeIn delay={0.2}>
                                <div className="group h-full relative p-10 rounded-3xl bg-wellness-green-light/30 border border-wellness-green/10 hover:shadow-premium transition-premium overflow-hidden">
                                    <div className="absoulte top-0 right-0 p-8 text-wellness-green opacity-10">
                                        <Sparkles className="w-20 h-20" />
                                    </div>
                                    <h3 className="font-heading text-2xl font-bold text-wellness-green mb-4">Phase 1: Follicular Softness</h3>
                                    <p className="text-wellness-forest/70 leading-relaxed mb-6">
                                        Focused on Flaxseeds and Pumpkin seeds. This phase supports healthy estrogen production during Days 1–14 of your cycle, preparing your body for healthy ovulation.
                                    </p>
                                    <Badge variant="outline" className="border-wellness-green text-wellness-green bg-white/50">Estrogen Support</Badge>
                                </div>
                            </FadeIn>
                            <FadeIn delay={0.4}>
                                <div className="group h-full relative p-10 rounded-3xl bg-wellness-sage/20 border border-wellness-forest/10 hover:shadow-premium transition-premium overflow-hidden">
                                     <div className="absoulte top-0 right-0 p-8 text-wellness-forest opacity-10">
                                        <Sparkles className="w-20 h-20" />
                                    </div>
                                    <h3 className="font-heading text-2xl font-bold text-wellness-forest mb-4">Phase 2: Luteal Warmth</h3>
                                    <p className="text-wellness-forest/70 leading-relaxed mb-6">
                                        Utilizing Sesame seeds and Sunflower seeds for Days 15–28. This blend supports progesterone production, helping to ease PMS and maintain internal balance.
                                    </p>
                                    <Badge variant="outline" className="border-wellness-forest text-wellness-forest bg-white/50">Progesterone Support</Badge>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </section>

                {/* --- Our Values: Premium Grids --- */}
                <section className="py-24 md:py-32 bg-wellness-green-light/10">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <FadeIn>
                            <h2 className="font-heading text-3xl md:text-5xl font-bold text-wellness-forest mb-16 text-center">
                                Our Guiding Values
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                {values.map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={i} className="flex gap-6 p-8 rounded-[2rem] glass-card glow-on-hover border-wellness-green/5">
                                            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-wellness-green text-white flex items-center justify-center shadow-lg shadow-wellness-green/20">
                                                <Icon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-heading text-xl font-bold text-wellness-forest mb-3">{item.title}</h3>
                                                <p className="text-wellness-forest/60 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* --- Highlights Bar --- */}
                <section className="py-20 bg-wellness-forest">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <FadeIn>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                                {highlights.map((item, i) => (
                                    <div key={i} className="flex flex-col items-center text-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-wellness-green-light/20 flex items-center justify-center mb-2">
                                            <CheckCircle2 className="w-5 h-5 text-wellness-green-light" />
                                        </div>
                                        <span className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-widest">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* --- High Impact Contact CTA --- */}
                <section className="py-32 md:py-48 relative overflow-hidden">
                     {/* Mesh Layer */}
                    <div className="absolute inset-0 z-0 mesh-bg-green opacity-40"></div>
                    
                    <div className="container mx-auto px-4 max-w-3xl relative z-10 text-center">
                        <FadeIn>
                            <h2 className="font-heading text-4xl md:text-6xl font-black text-wellness-forest mb-8 leading-tight">
                                Ready to start your <br/><span className="text-wellness-green italic">Harmony Journey?</span>
                            </h2>
                            <p className="text-lg md:text-xl text-wellness-forest/70 mb-12 max-w-xl mx-auto">
                                Our wellness consultants are here to help you find the perfect plan for your cycle.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                                <a
                                    href="https://wa.me/919347122416"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold shadow-xl shadow-green-200/50 transition-all hover:-translate-y-1"
                                >
                                    <Phone className="w-6 h-6" />
                                    WhatsApp Support
                                </a>
                                <Link
                                    to="/shop"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-wellness-forest text-white rounded-2xl font-bold hover:bg-wellness-forest/90 transition-all shadow-xl shadow-gray-200/50 hover:-translate-y-1"
                                >
                                    Shop Now
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                            
                            <div className="mt-16 flex items-center justify-center gap-8 grayscale opacity-50">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-wellness-forest">Trusted by 1000+ Women</span>
                                <div className="h-px w-12 bg-wellness-forest/20"></div>
                                <span className="text-[10px] font-bold tracking-widest uppercase text-wellness-forest">Hyderabad Delivery</span>
                            </div>
                        </FadeIn>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

const Badge = ({ children, variant = "default", className = "" }: { children: React.ReactNode, variant?: string, className?: string }) => {
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${className}`}>
            {children}
        </span>
    );
};
