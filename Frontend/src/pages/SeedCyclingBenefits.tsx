import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeIn } from "@/components/FadeIn";
import { Leaf, Sparkles, Calendar, ArrowRight } from "lucide-react";

export default function SeedCyclingBenefits() {
    useEffect(() => {
        // SEO Meta Tags Implementation
        document.title = "The Science of Seeds | Cycle Harmony";
        window.scrollTo(0, 0);

        // Add Schema Structured Data (JSON-LD)
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "The Art of Seed Cycling: A Modern Woman's Guide to Hormonal Synchrony",
            "description": "A sophisticated guide to ritualizing seed cycling for hormonal health.",
            "author": { "@type": "Organization", "name": "Cycle Harmony" },
            "publisher": { "@type": "Organization", "name": "Cycle Harmony" }
        };

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.innerHTML = JSON.stringify(schema);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    return (
        <div className="min-h-screen bg-wellness-cream/30">
            <Navbar />

            <main className="pt-40 pb-32 px-6">
                <div className="container mx-auto max-w-5xl space-y-20">
                    <FadeIn>
                        <header className="text-center space-y-8 max-w-4xl mx-auto">
                            <div className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-foreground/5 text-foreground/40 text-[10px] font-bold tracking-[0.3em] uppercase">
                                <Leaf className="w-3.5 h-3.5 mr-2 opacity-40" />
                                The Ritual Guide
                            </div>
                            <h1 className="font-heading text-6xl md:text-8xl font-bold text-foreground leading-tight tracking-tight">
                                The <span className="italic text-wellness-green">Symphony</span> of Seeds.
                            </h1>
                            <p className="text-xl md:text-2xl text-foreground/50 leading-relaxed font-body italic">
                                A comprehensive guide to understanding how nature's smallest seeds can unlock your greatest vitality.
                            </p>
                        </header>
                    </FadeIn>

                    <FadeIn delay={200}>
                        <article className="bg-white rounded-[3rem] shadow-premium border border-foreground/5 p-12 md:p-24 space-y-24">
                            
                            <section className="space-y-8">
                                <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground italic flex items-center gap-4">
                                    <Sparkles className="w-10 h-10 text-wellness-green opacity-40" />
                                    The Essence of Seed Cycling
                                </h2>
                                <div className="grid md:grid-cols-2 gap-12 font-body text-foreground/70 text-lg leading-relaxed">
                                    <p>
                                        Seed cycling is a sophisticated, natural practice that aligns with your biology. By ritualizing the consumption of specific seeds, we support the body's natural hormone production and detoxification.
                                    </p>
                                    <p>
                                        It's more than nutrition; it's about reconnecting with your internal seasons. The nutritional profile of our chosen seeds is perfectly calibrated to your body's specific needs at every stage of the month.
                                    </p>
                                </div>
                            </section>

                            <section className="bg-wellness-cream/20 p-12 rounded-[2.5rem] border border-foreground/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                                    <Calendar className="w-64 h-64" />
                                </div>
                                <div className="relative z-10 space-y-12">
                                    <h2 className="font-heading text-4xl font-bold text-foreground">The Lunar Protocol</h2>
                                    
                                    <div className="grid md:grid-cols-2 gap-16">
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <span className="text-wellness-green font-bold tracking-widest text-xs uppercase">Phase 01</span>
                                                <h3 className="font-heading text-3xl font-bold text-foreground">Follicular Ascent</h3>
                                            </div>
                                            <p className="text-foreground/60 font-body">Focusing on Days 1-14 to support healthy estrogen production.</p>
                                            <ul className="space-y-4">
                                                {['Flax Seeds: Lignans for Estrogen Balance', 'Pumpkin Seeds: Zinc for Vitality'].map(item => (
                                                    <li key={item} className="flex items-center gap-3 text-sm font-medium text-foreground/70">
                                                        <div className="h-2 w-2 rounded-full bg-wellness-green" /> {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <span className="text-wellness-sage font-bold tracking-widest text-xs uppercase">Phase 02</span>
                                                <h3 className="font-heading text-3xl font-bold text-foreground">Luteal Presence</h3>
                                            </div>
                                            <p className="text-foreground/60 font-body">Supporting progesterone production from Day 15 until renewal.</p>
                                            <ul className="space-y-4">
                                                {['Sesame Seeds: Hormonal Stability', 'Sunflower Seeds: Vitamin E & Detox'].map(item => (
                                                    <li key={item} className="flex items-center gap-3 text-sm font-medium text-foreground/70">
                                                        <div className="h-2 w-2 rounded-full bg-wellness-sage" /> {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-12">
                                <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground italic">Elevating the Journey</h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {[
                                        { title: "Metabolic Harmony", desc: "Reducing inflammation and supporting natural rhythms." },
                                        { title: "Dermal Radiance", desc: "Clearer, balanced skin through hormonal stability." },
                                        { title: "Emotional Clarity", desc: "Stable energy levels and improved mood consistency." },
                                        { title: "Cycle Precision", desc: "Establishing a predictable, healthy monthly cadence." }
                                    ].map((benefit, i) => (
                                        <div key={i} className="p-10 rounded-[2rem] bg-foreground/5 space-y-4 hover:bg-foreground hover:text-background transition-all group">
                                            <h4 className="text-2xl font-heading font-bold">{benefit.title}</h4>
                                            <p className="text-foreground/40 font-body group-hover:text-background/60">{benefit.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-foreground text-background p-16 rounded-[3rem] shadow-premium-lg text-center space-y-10 relative overflow-hidden">
                                <div className="absolute inset-0 bg-wellness-sage opacity-5 mix-blend-overlay"></div>
                                <div className="space-y-4 relative z-10">
                                    <h2 className="text-4xl md:text-6xl font-heading font-bold">Experience the Protocol.</h2>
                                    <p className="text-xl text-background/60 font-body max-w-xl mx-auto italic">
                                        We've simplified the ritual. Prepared fresh in Hyderabad, delivered for your health.
                                    </p>
                                </div>
                                <div className="relative z-10">
                                    <a 
                                        href="/shop" 
                                        className="inline-flex h-20 px-16 bg-background text-foreground rounded-full font-bold text-lg items-center justify-center hover:scale-105 transition-all shadow-premium"
                                    >
                                        Shop the Protocol
                                    </a>
                                </div>
                            </section>

                            <footer className="pt-20 border-t border-foreground/5 text-center space-y-10">
                                <div className="space-y-4">
                                    <h4 className="text-xl font-heading font-bold italic">Nature Always Remembers.</h4>
                                    <p className="text-foreground/40 font-body max-w-2xl mx-auto">
                                        Seed cycling is a journey, not a destination. Allow three cycles to witness the full metamorphosis.
                                    </p>
                                </div>
                                <a href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors">
                                    <ArrowRight className="w-4 h-4 rotate-180" /> Return to Sanctuary
                                </a>
                            </footer>

                        </article>
                    </FadeIn>
                </div>
            </main>

            <Footer />
        </div>
    );
}
