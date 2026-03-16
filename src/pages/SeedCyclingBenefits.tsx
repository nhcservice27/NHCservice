import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeIn } from "@/components/FadeIn";
import { Leaf, Sparkles, Activity, Heart, Calendar, BookOpen, CheckCircle2 } from "lucide-react";

export default function SeedCyclingBenefits() {
    useEffect(() => {
        // SEO Meta Tags Implementation
        document.title = "Seed Cycling Benefits for Hormone Balance | NHC";
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute("content", "Learn how seed cycling supports hormone balance and how NHC Seed Cycling Laddus make the process easy. Discover benefits for PCOS, PCOD, and PMS.");
        }

        // Add Schema Structured Data (JSON-LD)
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Seed Cycling Benefits for Hormone Balance: A Comprehensive Guide",
            "description": "A detailed guide on how seed cycling naturally supports women's hormonal health, focusing on fertility, PCOS, and PMS relief.",
            "author": {
                "@type": "Organization",
                "name": "NHC (Natural Hormone Care)"
            },
            "publisher": {
                "@type": "Organization",
                "name": "NHC",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://nhcservice.in/laddu_icon_round.png"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://nhcservice.in/seed-cycling-benefits"
            }
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
        <div className="min-h-screen">
            <Navbar />

            <main className="pt-24 pb-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <FadeIn>
                        <header className="text-center mb-16">
                            <div className="inline-flex items-center justify-center p-2 px-4 rounded-full bg-wellness-green/10 text-wellness-green text-sm font-bold mb-6 tracking-wide uppercase">
                                <Leaf className="w-4 h-4 mr-2" />
                                Natural Wellness Guide
                            </div>
                            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                                Seed Cycling Benefits for Hormone Balance
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                A comprehensive guide to understanding how nature's smallest seeds can unlock your greatest vitality.
                            </p>
                        </header>
                    </FadeIn>

                    <FadeIn delay={200}>
                        <article className="prose prose-lg prose-wellness max-w-none bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-shadow-card p-8 md:p-16 space-y-12 border border-white/50">
                            
                            <section>
                                <h2 className="font-heading text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                                    <Sparkles className="w-8 h-8 text-wellness-green" />
                                    What is Seed Cycling?
                                </h2>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    Seed cycling is an ancient, natural practice that has gained significant popularity in recent years as a powerful way to support women's hormonal health. By utilizing the nutritional power of specific seeds at different times of the menstrual cycle, women can help regulate their hormones, improve their reproductive health, and alleviate symptoms associated with conditions like PCOS and PMS.
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                    The practice is based on the idea that certain seeds contain specific types of oils, vitamins, and minerals that can support the body's natural hormone production and detoxification processes. While it might seem simple, the nutritional profile of these seeds is perfectly aligned with the needs of a woman's body during different times of the month.
                                </p>
                            </section>

                            <section className="bg-wellness-cream/50 p-8 rounded-3xl border border-wellness-green/10">
                                <h2 className="font-heading text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                                    <Calendar className="w-8 h-8 text-wellness-green" />
                                    How Seed Cycling Works
                                </h2>
                                <p className="text-gray-700 leading-relaxed mb-8">
                                    To understand how seed cycling works, we first need to look at the two halves of the menstrual cycle: the follicular phase and the luteal phase. Your body's nutritional requirements shift significantly between these two periods.
                                </p>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="font-heading text-xl font-bold text-wellness-green">Phase 1: Follicular (Day 1-14)</h3>
                                        <p className="text-sm text-gray-700">Starts on the first day of your period. The goal is to support healthy estrogen production.</p>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2 text-sm text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-wellness-green mt-1 flex-shrink-0" />
                                                <span><strong>Flax Seeds:</strong> Rich in lignans to balance estrogen dominance.</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-wellness-green mt-1 flex-shrink-0" />
                                                <span><strong>Pumpkin Seeds:</strong> High in Zinc for progesterone preparation.</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-heading text-xl font-bold text-wellness-pink">Phase 2: Luteal (Day 15-28)</h3>
                                        <p className="text-sm text-gray-700">Starts after ovulation. The goal is to support natural progesterone levels.</p>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2 text-sm text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-wellness-pink mt-1 flex-shrink-0" />
                                                <span><strong>Sesame Seeds:</strong> Lignans to support the progesterone shift.</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-wellness-pink mt-1 flex-shrink-0" />
                                                <span><strong>Sunflower Seeds:</strong> Selenium for liver detox and Vitamin E.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="font-heading text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                                    <Activity className="w-8 h-8 text-wellness-green" />
                                    Benefits of Seed Cycling for Women's Health
                                </h2>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    The benefits of seed cycling extend far beyond just "balancing hormones." Many women report a wide range of positive changes after consistently practicing seed cycling for three to four months:
                                </p>
                                <div className="grid gap-6">
                                    {[
                                        { title: "Reduced PMS Symptoms", desc: "By balancing the estrogen-to-progesterone ratio, seed cycling can help reduce bloating, breast tenderness, mood swings, and headaches." },
                                        { title: "Improved Period Regularity", desc: "For women with irregular cycles, consistent nutritional support can help establish a more predictable rhythm." },
                                        { title: "Better Skin Health", desc: "Hormonal acne is often linked to estrogen dominance. Balancing these hormones can lead to clearer, healthier skin." },
                                        { title: "Enhanced Mood & Energy", desc: "Stable hormones lead to more consistent energy levels and emotional stability throughout the month." }
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white shadow-sm border border-gray-100">
                                            <div className="w-10 h-10 rounded-full bg-wellness-green/10 flex items-center justify-center flex-shrink-0 text-wellness-green font-bold">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{benefit.title}</h4>
                                                <p className="text-gray-600 text-sm">{benefit.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="font-heading text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                                    <Heart className="w-8 h-8 text-wellness-pink" />
                                    Seed Cycling for PCOS and PCOD
                                </h2>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    Polycystic Ovary Syndrome (PCOS) is one of the most common hormonal disorders among women. It is characterized by irregular periods, excess androgen levels, and polycystic ovaries. 
                                </p>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    Seed cycling can be a particularly effective natural intervention for PCOS because it addresses several of the underlying issues. The **Zinc** in pumpkin seeds and the **Lignans** in flax and sesame seeds help regulate androgen production and metabolism, which is a core challenge in PCOS management.
                                </p>
                                <div className="bg-wellness-pink/5 border-l-4 border-wellness-pink p-6 rounded-r-2xl italic text-gray-700">
                                    "Many of our customers with PCOS report significant improvements in their cycles and energy levels within just 90 days of consistent seed cycling."
                                </div>
                            </section>

                            <section className="bg-gradient-to-br from-wellness-green/10 to-wellness-pink/10 p-10 rounded-[2rem] border border-white relative overflow-hidden">
                                <div className="relative z-10 text-center">
                                    <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
                                        Why Choose NHC Seed Cycling Laddus?
                                    </h2>
                                    <p className="text-gray-700 mb-8 max-w-xl mx-auto leading-relaxed">
                                        While seed cycling is simple in theory, grinding seeds every day and maintaining the right portions is difficult. We've simplified it for you.
                                    </p>
                                    <div className="grid md:grid-cols-3 gap-6 mb-10 text-left">
                                        <div className="p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                                            <BookOpen className="w-6 h-6 text-wellness-green mb-2" />
                                            <p className="text-xs font-bold text-gray-900 uppercase tracking-tighter mb-1">Expertly Formulated</p>
                                            <p className="text-[10px] text-gray-600">Exact ratios for each phase.</p>
                                        </div>
                                        <div className="p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                                            <Activity className="w-6 h-6 text-wellness-pink mb-2" />
                                            <p className="text-xs font-bold text-gray-900 uppercase tracking-tighter mb-1">Phase-Specific</p>
                                            <p className="text-[10px] text-gray-600">Two distinct, easy-to-use laddus.</p>
                                        </div>
                                        <div className="p-4 bg-white/60 rounded-xl backdrop-blur-sm">
                                            <Activity className="w-6 h-6 text-wellness-green mb-2" />
                                            <p className="text-xs font-bold text-gray-900 uppercase tracking-tighter mb-1">Natural & Tasty</p>
                                            <p className="text-[10px] text-gray-600">Pure ingredients, delightful taste.</p>
                                        </div>
                                    </div>
                                    <a 
                                        href="https://nhcservice.in" 
                                        className="inline-block bg-wellness-green text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-wellness-green/90 transition-all hover:scale-105 active:scale-95"
                                    >
                                        Shop NHC Seed Cycling Laddus
                                    </a>
                                </div>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Conclusion</h2>
                                <p className="text-gray-700 leading-relaxed mb-8">
                                    Seed cycling is more than just a diet trend; it's a way to reconnect with your body's natural rhythms. By providing your endocrine system with the specific nutrients it needs at the right time, you can unlock a new level of wellness and vitality.
                                </p>
                                <div className="text-center pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
                                    <p className="text-sm text-gray-500 font-medium">Ready to start your journey?</p>
                                    <a 
                                        href="/" 
                                        className="text-wellness-green hover:text-wellness-pink font-bold transition-colors flex items-center gap-2"
                                    >
                                        ← Return to Homepage
                                    </a>
                                </div>
                            </section>

                        </article>
                    </FadeIn>
                </div>
            </main>

            <Footer />
        </div>
    );
}
