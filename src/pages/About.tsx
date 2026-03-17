import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FadeIn } from "@/components/FadeIn";
import { Leaf, Heart, Target, Sparkles, CheckCircle2, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-nhc.jpg";

export default function About() {
    useEffect(() => {
        document.title = "About Us | NHC Natural Health Care Services";
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute("content", "Learn about NHC Natural Health Care Services - dedicated to balancing women's hormones naturally through seed cycling laddus. Hyderabad-based wellness for PCOS, PCOD & PMS.");
        }
    }, []);

    const values = [
        { icon: Leaf, title: "100% Natural", desc: "We use only natural ingredients - no artificial preservatives or additives." },
        { icon: Heart, title: "Women-First", desc: "Designed specifically for women's hormonal health and wellness." },
        { icon: Target, title: "Science-Backed", desc: "Seed cycling is rooted in nutritional science and traditional wisdom." },
        { icon: Sparkles, title: "Tasty & Easy", desc: "Healthy doesn't mean boring - our laddus are delicious and convenient." },
    ];

    const highlights = [
        "100% Natural Ingredients",
        "No Artificial Preservatives",
        "Doctor-Friendly Formula",
        "Traditional Ayurvedic Base",
        "Easy to Digest",
        "Sustainable & Eco-Friendly",
    ];

    return (
        <div className="min-h-screen">
            <Navbar />

            <main className="pt-24 pb-20">
                {/* Hero Section */}
                <section className="relative py-20 overflow-hidden bg-gradient-to-br from-wellness-cream via-white to-wellness-pink/20">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />
                    <div className="container mx-auto px-4 max-w-5xl relative z-10">
                        <FadeIn>
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="flex-shrink-0">
                                    <img src={logo} alt="NHC" className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-xl border-4 border-white" />
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wellness-green/10 text-wellness-green text-sm font-bold mb-4 tracking-wide uppercase">
                                        <Leaf className="w-4 h-4" />
                                        Natural Health Care
                                    </div>
                                    <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                                        About NHC Natural Health Care Services
                                    </h1>
                                    <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                                        Dedicated to balancing women's hormones naturally through the power of seed cycling.
                                    </p>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* Our Story */}
                <section className="py-20 bg-white/50">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <FadeIn>
                            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
                                Our Story & Mission
                            </h2>
                            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                                <p>
                                    <strong>NHC Natural Health Care Services</strong> was born from a simple belief: women deserve natural, effective solutions for hormonal wellness. We noticed that many women struggle with conditions like PCOS, PCOD, and PMS, often relying on synthetic supplements with unwanted side effects.
                                </p>
                                <p>
                                    We turned to <strong>seed cycling</strong> — an ancient, natural practice that supports hormonal balance by consuming specific seeds during different phases of the menstrual cycle. Our laddus make this practice easy, tasty, and sustainable for everyday life.
                                </p>
                                <p>
                                    Our mission is to help women achieve hormonal balance naturally through our carefully crafted Phase I and Phase II Seed Cycling Laddus — delivered with care to your doorstep in Hyderabad.
                                </p>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* What We Do */}
                <section className="py-20 bg-gradient-to-br from-wellness-green-light/20 via-white to-wellness-pink/20">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <FadeIn>
                            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
                                What We Do
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-wellness-green/10">
                                    <h3 className="font-heading text-xl font-bold text-wellness-green mb-4">Phase I Laddus</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        Flaxseeds and pumpkin seeds to support your follicular phase (Days 1–14). Helps boost estrogen levels naturally and support healthy ovulation.
                                    </p>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-wellness-pink/20">
                                    <h3 className="font-heading text-xl font-bold text-wellness-pink mb-4">Phase II Laddus</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        Sesame seeds and sunflower seeds to nourish your luteal phase (Days 15–28). Supports progesterone production and reduces PMS symptoms.
                                    </p>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* Our Values */}
                <section className="py-20 bg-white/50">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <FadeIn>
                            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-12 text-center">
                                Our Values
                            </h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                {values.map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={i} className="flex gap-4 p-6 rounded-2xl bg-white/80 shadow-md hover:shadow-lg transition-all border border-gray-100">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-wellness-green/10 flex items-center justify-center">
                                                <Icon className="w-6 h-6 text-wellness-green" />
                                            </div>
                                            <div>
                                                <h3 className="font-heading text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                                                <p className="text-gray-600">{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* Why Choose Us */}
                <section className="py-20 bg-gradient-to-br from-wellness-green-light/20 to-wellness-pink/20">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <FadeIn>
                            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
                                Why Choose Our Laddus?
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {highlights.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/80 shadow-sm">
                                        <CheckCircle2 className="w-5 h-5 text-wellness-green flex-shrink-0" />
                                        <span className="font-medium text-gray-800">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* Contact CTA */}
                <section className="py-20 bg-white/50">
                    <div className="container mx-auto px-4 max-w-2xl text-center">
                        <FadeIn>
                            <h2 className="font-heading text-3xl font-bold text-gray-800 mb-6">
                                Get in Touch
                            </h2>
                            <p className="text-gray-600 mb-8">
                                Have questions? We'd love to hear from you. Reach out anytime.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="https://wa.me/919347122416"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-semibold transition-all"
                                >
                                    <Phone className="w-5 h-5" />
                                    WhatsApp
                                </a>
                                <a
                                    href="mailto:nhccycleharmony@gmail.com"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-wellness-pink hover:bg-wellness-pink/90 text-white rounded-xl font-semibold transition-all"
                                >
                                    <Mail className="w-5 h-5" />
                                    Email Us
                                </a>
                            </div>
                            <p className="mt-6 text-sm text-gray-500">
                                Delivery available in Hyderabad only
                            </p>
                            <Link
                                to="/shop"
                                className="inline-block mt-8 px-8 py-3 bg-gradient-to-r from-wellness-green to-wellness-green/90 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                                Shop Seed Cycling Laddus
                            </Link>
                        </FadeIn>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
