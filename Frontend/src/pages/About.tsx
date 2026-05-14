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
        document.title = "Our Movement | Cycle Harmony";
        window.scrollTo(0, 0);
    }, []);

    const values = [
        { icon: Leaf, title: "Purely Natural", desc: "Crafted with 100% whole, raw seeds. No additives, no preservatives, just nature's design." },
        { icon: Heart, title: "Hormonal Harmony", desc: "Designed to align with your cycle's phases, supporting your body's natural rhythms." },
        { icon: Target, title: "Precision Crafted", desc: "Each laddu contains the exact daily dose of specific seeds to optimize Phase 1 and Phase 2 efficacy." },
        { icon: Sparkles, title: "Wellness Elevated", desc: "Healthy living should be easy and delicious. Our premium laddus make seed cycling a joy." },
    ];

    return (
        <div className="min-h-screen bg-wellness-cream/30">
            <Navbar />

            <main>
                {/* --- Hero Section: Editorial Elegance --- */}
                <section className="relative pt-48 pb-32 overflow-hidden bg-white">
                    <div className="container mx-auto px-6 max-w-6xl relative z-10">
                        <FadeIn>
                            <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-12">
                                <div className="space-y-6">
                                    <span className="text-foreground/40 font-bold tracking-[0.3em] uppercase text-[10px] block">
                                        The Philosophy
                                    </span>
                                    <h1 className="font-heading text-6xl md:text-8xl font-bold text-foreground leading-[1] tracking-tight">
                                        Cultivating <span className="italic text-wellness-green">Balance</span> through Nature.
                                    </h1>
                                </div>
                                <p className="text-xl md:text-2xl text-foreground/60 leading-relaxed font-body max-w-2xl">
                                    We believe that hormonal wellness shouldn't be a struggle. By honoring your body's natural cycle, we help you achieve vibrant health, one seed at a time.
                                </p>
                                <div className="flex flex-wrap justify-center gap-6">
                                    <Link 
                                        to="/shop" 
                                        className="h-16 px-10 bg-foreground text-background rounded-full font-bold hover:shadow-premium-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        Explore Protocol <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <a 
                                        href="#mission" 
                                        className="h-16 px-10 border border-foreground/10 text-foreground/60 rounded-full font-bold hover:border-foreground transition-all flex items-center justify-center"
                                    >
                                        Our Story
                                    </a>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* --- Mission Section: Sophisticated Copy --- */}
                <section id="mission" className="py-32 md:py-48 bg-wellness-cream/20">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <div className="grid md:grid-cols-12 gap-20 items-center">
                            <div className="md:col-span-12 text-center md:text-left">
                                <FadeIn>
                                    <div className="max-w-4xl mx-auto md:mx-0 space-y-16">
                                        <h2 className="font-heading text-4xl md:text-6xl font-bold text-foreground leading-tight italic">
                                            "Born from a simple need: <br/>Natural solutions for modern women."
                                        </h2>
                                        <div className="grid md:grid-cols-2 gap-12 text-foreground/70 text-lg leading-relaxed font-body">
                                            <p>
                                                <strong>Cycle Harmony</strong> was founded on the principle that the most effective health interventions are often those that work in harmony with our biology.
                                            </p>
                                            <p>
                                                In an era of synthetic quick-fixes, we saw too many women navigating hormonal imbalances without sustainable support. We looked back at traditional wisdom and nutritional science to rediscover <strong>Seed Cycling</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </FadeIn>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Value Grid: High End Cards --- */}
                <section className="py-32 bg-white">
                    <div className="container mx-auto px-6 max-w-6xl">
                        <div className="grid md:grid-cols-2 gap-8">
                            {values.map((item, i) => (
                                <FadeIn key={i} delay={i * 0.1}>
                                    <div className="p-12 rounded-[2.5rem] bg-wellness-cream/10 border border-foreground/5 transition-premium group hover:shadow-premium h-full">
                                        <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center mb-8 shadow-premium group-hover:scale-110 transition-transform">
                                            <item.icon className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-3xl font-heading font-bold mb-4">{item.title}</h3>
                                        <p className="text-foreground/50 font-body leading-relaxed text-lg">{item.desc}</p>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- The Origin Ritual --- */}
                <section className="py-32 bg-foreground text-background rounded-[4rem] mx-6 mb-12 shadow-premium-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                        <Leaf className="w-64 h-64" />
                    </div>
                    <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
                        <FadeIn>
                            <span className="text-wellness-sage font-bold tracking-[0.4em] uppercase text-[10px] mb-10 block opacity-50">Local Mastery</span>
                            <h2 className="text-5xl md:text-7xl font-heading font-bold mb-12 leading-tight">
                                Handcrafted with <br/>care in <span className="italic text-wellness-sage">Hyderabad</span>.
                            </h2>
                            <p className="text-xl md:text-2xl text-background/60 leading-relaxed font-body max-w-2xl mx-auto mb-16">
                                Each protocol is freshly prepared to ensure maximum nutritional potency. From our kitchen to your healing ritual.
                            </p>
                            <Link 
                                to="/shop" 
                                className="inline-flex h-20 px-16 bg-wellness-sage text-foreground rounded-full font-bold text-lg items-center justify-center hover:scale-105 transition-all shadow-premium"
                            >
                                Start Your Journey
                            </Link>
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
