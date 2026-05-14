import cycleInfographic from "@/assets/cycle_infographic.png";

export function WhatIsSeedCycling() {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-wellness-cream/20 -skew-x-12 transform origin-top translate-x-20 -z-10"></div>

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-24 space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-foreground/5 text-foreground/40 text-[10px] uppercase font-bold tracking-[0.2em]">
            The Ancient Wisdom
          </div>
          <h2 className="font-heading text-5xl md:text-7xl font-bold text-foreground tracking-tight">
            What is <span className="italic text-wellness-green">Seed Cycling?</span>
          </h2>
          <p className="text-xl text-foreground/60 max-w-3xl mx-auto leading-[1.8] font-body">
            A gentle yet powerful rhythmic nutritional practice that syncs with your cycle’s natural ebb and flow. Consuming specific seeds supports hormonal harmony naturally.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-20 items-center">
          {/* Infographic Container */}
          <div className="lg:col-span-6 relative group">
            <div className="absolute -inset-8 bg-wellness-pink/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <img
              src={cycleInfographic}
              alt="Cycle Infographic"
              className="relative w-full max-w-xl mx-auto h-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.06)] transform transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>

          {/* Process Detail */}
          <div className="lg:col-span-6 space-y-10">
            <div className="space-y-8">
              <div className="relative pl-12 group transition-all duration-500">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full border border-foreground/10 flex items-center justify-center text-xs font-bold text-foreground/30 group-hover:border-wellness-green group-hover:text-wellness-green transition-colors">
                  01
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-3">
                  Follicular Phase <span className="text-sm font-medium text-foreground/40 ml-2">(Days 1-14)</span>
                </h3>
                <p className="text-base text-foreground/60 leading-relaxed">
                  Organic flax and pumpkin seeds provide essential fatty acids that support estrogen production and healthy ovulation.
                </p>
              </div>

              <div className="relative pl-12 group transition-all duration-500">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full border border-foreground/10 flex items-center justify-center text-xs font-bold text-foreground/30 group-hover:border-wellness-green group-hover:text-wellness-green transition-colors">
                  02
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-3">
                  Luteal Phase <span className="text-sm font-medium text-foreground/40 ml-2">(Days 15-28)</span>
                </h3>
                <p className="text-base text-foreground/60 leading-relaxed">
                  Sesame and sunflower seeds support natural progesterone levels, easing the transition into your next cycle.
                </p>
              </div>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-foreground text-background shadow-premium relative overflow-hidden group">
              <div className="absolute inset-0 bg-wellness-green opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              <p className="text-lg relative z-10 font-medium leading-relaxed italic">
                “Our laddus transform these potent seeds into a gourmet ritual you’ll look forward to every single day.”
              </p>
              <div className="mt-6 flex items-center gap-3 relative z-10">
                 <div className="w-8 h-px bg-background/30"></div>
                 <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-background/50">Crafted with Love</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}