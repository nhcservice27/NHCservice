import { Flower2, Sparkles, Moon, Leaf, Shield } from "lucide-react";

const benefits = [
  {
    icon: Flower2,
    title: "Balance PCOD/PCOS",
    description: "Supports hormonal balance and helps regulate menstrual cycles"
  },
  {
    icon: Sparkles,
    title: "Fertility Support",
    description: "Care for your reproductive system with nourishing nutrients that support your fertility journey."
  },
  {
    icon: Shield,
    title: "PMS Relief",
    description: "Reduce mood swings, bloating, and other uncomfortable PMS symptoms"
  },
  {
    icon: Sparkles,
    title: "Glowing Skin",
    description: "Achieve clearer, more radiant skin through balanced hormones"
  },
  {
    icon: Moon,
    title: "Better Sleep",
    description: "Improve sleep quality and reduce nighttime restlessness"
  },
  {
    icon: Leaf,
    title: "Natural Nutrients",
    description: "Rich in omega-3s, lignans, vitamins, and minerals your body needs"
  }
];

export function BenefitsSection() {
  return (
    <section className="py-32 bg-wellness-cream/20 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>

      <div className="container mx-auto px-6 relative z-10 max-w-7xl">
        <div className="text-center mb-24 space-y-6">
           <div className="inline-block px-4 py-1.5 rounded-full bg-foreground/5 text-foreground/40 text-[10px] uppercase font-bold tracking-[0.2em] animate-in fade-in slide-in-from-bottom-4 duration-700">
            Wellness Benefits
          </div>
          <h2 className="font-heading text-5xl md:text-7xl font-bold text-foreground tracking-tight">
            Nourish Your <span className="italic text-wellness-green">Well-being.</span>
          </h2>
          <p className="text-xl text-foreground/60 max-w-3xl mx-auto leading-relaxed font-body animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Experience the holistic transformation that comes from aligning your nutrition with your cycle’s natural wisdom.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group bg-white p-10 rounded-[2.5rem] border border-foreground/5 shadow-premium hover:shadow-premium-lg transition-all duration-700 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center w-14 h-14 bg-foreground/5 rounded-[1.25rem] mb-8 group-hover:bg-wellness-green group-hover:text-white transition-all duration-500">
                  <Icon className="w-6 h-6 text-foreground/60 group-hover:text-white" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-4">
                  {benefit.title}
                </h3>
                <p className="text-foreground/60 leading-relaxed font-body">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}