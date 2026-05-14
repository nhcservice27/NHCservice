import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Star, Check } from "lucide-react";
import phase1Image from "@/assets/phase_1_transprant.png";
import phase2Image from "@/assets/Phase_2_transprant.png";
import { CycleCompanion } from "@/components/CycleCompanion";
import { Footer } from "@/components/Footer";
import { FadeIn } from "@/components/FadeIn";

const RATE_P1 = Number(import.meta.env.VITE_PRICE_PER_LADDU_PHASE1 || 33.27);
const RATE_P2 = Number(import.meta.env.VITE_PRICE_PER_LADDU_PHASE2 || 33.27);

const products = [
    {
        id: 1,
        name: "Phase I Laddu",
        description: "Specially crafted with flaxseeds and pumpkin seeds to support your follicular phase. These nutrient-dense laddus help boost estrogen levels naturally and support healthy ovulation.",
        price: Math.round(RATE_P1 * 15),
        originalPrice: Math.round(RATE_P1 * 15 * 1.2),
        image: phase1Image,
        days: "Days 1-14",
        ingredients: "Flaxseeds, Pumpkin Seeds, Jaggery, Ghee",
        benefits: [
            "Supports healthy estrogen balance",
            "Helps regulate ovulation (beneficial for PCOD/PCOS)",
            "Reduces inflammation and hormonal imbalance",
            "Rich in omega-3 fatty acids for skin and metabolic support"
        ],
        rating: 4.8,
        reviews: 156,
        badge: "Best Seller",
        badgeColor: "bg-green-500",
        quantity: 15
    },
    {
        id: 2,
        name: "Phase II Laddu",
        description: "Formulated with sesame seeds and sunflower seeds to nourish your luteal phase. These delicious laddus help support progesterone production and reduce PMS symptoms.",
        price: Math.round(RATE_P2 * 15),
        originalPrice: Math.round(RATE_P2 * 15 * 1.2),
        image: phase2Image,
        days: "Days 15-28",
        ingredients: "Sesame Seeds, Sunflower Seeds, Jaggery, Ghee",
        benefits: [
            "Supports natural progesterone production",
            "Helps reduce PMS and mood swings",
            "Supports better sleep and stress balance",
            "Rich in vitamin E and antioxidants for reproductive health"
        ],
        rating: 4.9,
        reviews: 143,
        badge: "Popular",
        badgeColor: "bg-pink-500",
        quantity: 15
    }
];

export default function ShopNow() {
    const handleAddToCart = (productName: string) => {
        const element = document.getElementById('cycle-phase-checker');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-wellness-cream/30">
            <Navbar />

            {/* Catalogue Header */}
            <section className="pt-40 pb-20 px-6 relative overflow-hidden">
                <div className="container mx-auto max-w-7xl relative z-10 text-center">
                    <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-wellness-green/10 text-wellness-green text-[10px] uppercase font-bold tracking-[0.2em] animate-in fade-in slide-in-from-bottom-4 duration-700">
                        The Collection
                    </div>
                    <h1 className="text-6xl md:text-8xl font-heading font-bold text-foreground mb-8 tracking-tight">
                        Choose Your <span className="italic text-wellness-green">Harmony.</span>
                    </h1>
                    <p className="text-xl text-foreground/60 max-w-2xl mx-auto font-body leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Precision-crafted seed cycling laddus designed to support your natural rhythm through every phase.
                    </p>
                </div>
            </section>

            {/* Products Grid */}
            <section className="pb-32 px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid md:grid-cols-2 gap-12">
                        {products.map((product) => (
                            <div key={product.id} className="group relative">
                                <div className="bg-white rounded-[2.5rem] overflow-hidden border border-foreground/5 shadow-premium transition-all duration-700 hover:shadow-premium-lg hover:-translate-y-2">
                                    
                                    {/* Image Container */}
                                    <div className="relative aspect-[4/3] bg-foreground/5 overflow-hidden flex items-center justify-center p-12">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-contain transform transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-2"
                                        />
                                        
                                        <div className="absolute top-8 left-8">
                                            <span className="bg-white/80 backdrop-blur-md text-foreground text-[10px] font-bold px-4 py-2 rounded-full shadow-sm tracking-widest uppercase">
                                                {product.days}
                                            </span>
                                        </div>
                                        
                                        <div className="absolute top-8 right-8">
                                             <div className="h-10 w-10 flex items-center justify-center bg-wellness-green text-white rounded-full shadow-lg transform transition-transform duration-500 hover:rotate-12">
                                                <Star className="h-4 w-4 fill-white" />
                                             </div>
                                        </div>
                                    </div>

                                    {/* Content Container */}
                                    <div className="p-10 space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <h3 className="text-4xl font-heading font-bold text-foreground">
                                                    {product.name}
                                                </h3>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-3xl font-bold text-foreground">₹{product.price}</span>
                                                    <span className="text-sm text-foreground/30 line-through">₹{product.originalPrice}</span>
                                                </div>
                                            </div>
                                            <p className="text-base text-foreground/60 leading-relaxed font-body">
                                                {product.description}
                                            </p>
                                        </div>

                                        {/* Benefits Mini Grid */}
                                        <div className="grid grid-cols-1 border-t border-foreground/5 pt-8 gap-4">
                                            {product.benefits.slice(0, 3).map((benefit, i) => (
                                                <div key={i} className="flex items-center gap-4 group/item">
                                                    <div className="h-6 w-6 rounded-full bg-wellness-green/10 flex items-center justify-center transition-colors group-hover/item:bg-wellness-green/20">
                                                        <Check className="h-3 w-3 text-wellness-green" />
                                                    </div>
                                                    <span className="text-sm text-foreground/70 font-medium">{benefit}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action */}
                                        <Button
                                            variant="hero"
                                            onClick={() => handleAddToCart(product.name)}
                                            className="w-full rounded-full h-16 flex items-center justify-center gap-3 overflow-hidden relative group/btn"
                                        >
                                            <span className="relative z-10 flex items-center gap-2">
                                                Add to Ritual <ShoppingCart className="h-5 w-5" />
                                            </span>
                                            <div className="absolute inset-0 bg-wellness-green transform translate-y-full transition-transform duration-500 group-hover/btn:translate-y-0"></div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <CycleCompanion />
            <Footer />
        </div>
    );
}

