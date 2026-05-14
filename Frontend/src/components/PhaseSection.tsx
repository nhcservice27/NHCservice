import phase1Ingredients from "@/assets/phase_1_transprant.png";
import phase2Ingredients from "@/assets/Phase_2_transprant.png";

interface PhaseSectionProps {
  phase: 1 | 2;
  title: string;
  description: string;
  benefits: string[];
  days: string;
  time: string;
  backgroundColor: string;
}

export function PhaseSection({
  phase,
  title,
  description,
  benefits,
  days,
  time,
  backgroundColor
}: PhaseSectionProps) {
  const image = phase === 1 ? phase1Ingredients : phase2Ingredients;
  const isPhase1 = phase === 1;

  return (
    <section className={`py-32 ${backgroundColor} overflow-hidden`}>
      <div className="container mx-auto px-6 max-w-7xl">
        <div className={`grid lg:grid-cols-12 gap-16 items-center ${!isPhase1 ? 'lg:flex lg:flex-row-reverse' : ''}`}>
          
          {/* Visual Side */}
          <div className="lg:col-span-6 relative">
            <div className="relative group">
              <div className="absolute -inset-10 bg-white/40 rounded-[3rem] blur-2xl transform transition-transform duration-700 group-hover:scale-110"></div>
              <img
                src={image}
                alt={title}
                className="relative w-full max-w-lg mx-auto h-auto object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.08)] transform transition-all duration-700 hover:scale-105 hover:rotate-3"
              />
              
              {/* Floating Badge */}
              <div className="absolute top-0 right-0 lg:-right-8 bg-foreground text-background px-6 py-6 rounded-full shadow-premium flex flex-col items-center justify-center animate-bounce-slow">
                <span className="text-2xl font-bold font-heading">{phase === 1 ? '01' : '02'}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Phase</span>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="lg:col-span-6 space-y-12">
            <div className="space-y-6">
              <div className="inline-block px-5 py-2 rounded-full bg-foreground/5 text-foreground/50 text-[10px] uppercase font-bold tracking-[0.2em]">
                Optimal Timing: {days}
              </div>
              <h2 className="font-heading text-5xl md:text-6xl font-bold text-foreground leading-tight">
                {title}
              </h2>
              <p className="text-xl text-foreground/60 leading-relaxed font-body">
                {description}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4 p-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-premium transition-transform hover:-translate-y-2">
                <div className="h-10 w-10 rounded-full bg-wellness-green/10 flex items-center justify-center">
                   <span className="text-wellness-green text-sm">✦</span>
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">Usage Ritual</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                   Integrate one handcrafted laddu into your morning routine for consistent hormonal support.
                </p>
              </div>

              <div className="space-y-4 p-8 rounded-3xl bg-foreground text-background shadow-premium transition-transform hover:-translate-y-2">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                   <span className="text-white text-sm">✓</span>
                </div>
                <h3 className="font-heading text-lg font-bold">Key Benefits</h3>
                <ul className="space-y-2">
                   {benefits.slice(0, 3).map((b, i) => (
                     <li key={i} className="text-xs text-background/80 flex items-center gap-2">
                        <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                        {b}
                     </li>
                   ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}