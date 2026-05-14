import { Button } from "@/components/Button";
import heroLaddus from "@/assets/phase_1_2.png";

export function HeroSection() {
  const scrollToChecker = () => {
    const element = document.getElementById('cycle-phase-checker');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 mesh-bg-green opacity-40 -z-10"></div>
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/30 rounded-full blur-[100px] animate-pulse delay-700"></div>

      <div className="container mx-auto px-6 max-w-7xl relative z-20">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-10 text-center lg:text-left">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 text-foreground/60 text-xs font-bold uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="w-2 h-2 rounded-full bg-wellness-green animate-pulse"></span>
                Natural Hormone Support
              </div>
              
              <h1 className="font-heading text-6xl md:text-8xl lg:text-[7rem] font-bold text-foreground leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000">
                Hormonal Balance <br /> 
                <span className="text-wellness-green italic">reimagined.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-foreground/60 font-body leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                Ancient seed cycling wisdom met with modern handcrafted wellness. 
                Delicious laddus designed to support your natural rhythm.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-400">
              <Button variant="hero" onClick={scrollToChecker} className="rounded-full h-16 px-10">
                Start My Journey
              </Button>
              <Button variant="outline" onClick={() => window.location.href='/shop'} className="rounded-full h-16 px-10 border-foreground/20 text-foreground hover:bg-foreground hover:text-background">
                Browse Shop
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 animate-in fade-in duration-1000 delay-700">
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-2xl font-bold">100%</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">Natural</span>
              </div>
              <div className="w-px h-8 bg-foreground/20"></div>
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-2xl font-bold">Organic</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">Seeds</span>
              </div>
              <div className="w-px h-8 bg-foreground/20"></div>
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-2xl font-bold">Lab</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">Tested</span>
              </div>
            </div>
          </div>

          {/* Hero Image / Visual */}
          <div className="lg:col-span-5 relative group">
            <div className="relative z-10 animate-in fade-in zoom-in-95 duration-1000 delay-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-wellness-green-light/20 rounded-[3rem] blur-2xl transform rotate-6 scale-95 transition-transform duration-700 group-hover:rotate-0"></div>
              <img
                src={heroLaddus}
                alt="Premium Seed Cycling Laddus"
                className="relative w-full h-auto object-contain drop-shadow-[0_45px_65px_rgba(0,0,0,0.12)] transform transition-all duration-700 hover:scale-105 hover:-rotate-2 z-20"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}