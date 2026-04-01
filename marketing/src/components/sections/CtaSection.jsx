import React from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';

const CtaSection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-[#0B1F3A]">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0NjhhZWEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djIwaDJWMzRoLTJ6bS0xOCAyMHYtMjBoLTJ2MjBoMnptMTAtMjBWMTRoLTJ2MjBoMnptMThWMTRoLTJ2MjBoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[150px] mix-blend-screen opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600 rounded-full blur-[150px] mix-blend-screen opacity-20 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-8 tracking-tight">
          Transform Your School <br className="hidden md:block"/> Operations <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Today</span>
        </h2>
        
        <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-12 leading-relaxed">
          Join the next generation of digitally empowered institutions. Book your personalized demo and see the impact instantly.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 group">
            Book a Free Demo
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-lg transition-all flex items-center justify-center gap-2 backdrop-blur-md">
            <PlayCircle className="w-5 h-5" />
            Get Started
          </button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 text-blue-200/60 text-sm">
          <span className="flex items-center gap-1">✅ No credit card required</span>
          <span className="flex items-center gap-1">✅ 14-day free trial</span>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
