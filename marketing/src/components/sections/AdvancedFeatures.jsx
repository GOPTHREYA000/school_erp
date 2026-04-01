import React from 'react';
import { BrainCircuit, TrendingUp, Navigation, Zap, BookOpenCheck } from 'lucide-react';

const AdvancedFeatures = () => {
  const features = [
    { icon: <BrainCircuit className="w-6 h-6" />, title: "AI-Based Insights", desc: "Predict student dropouts and performance dips before they happen." },
    { icon: <TrendingUp className="w-6 h-6" />, title: "Fee Forecasting", desc: "Machine learning algorithms that predict monthly cash flow and collection rates." },
    { icon: <Navigation className="w-6 h-6" />, title: "Live Bus Tracking", desc: "Real-time GPS integration with automated proximity alerts for parents." },
    { icon: <Zap className="w-6 h-6" />, title: "Smart Automations", desc: "Create trigger-based workflows for admissions, HR, and communication." },
    { icon: <BookOpenCheck className="w-6 h-6" />, title: "Built-in LMS", desc: "A powerful Learning Management System seamlessly integrated with the ERP." }
  ];

  return (
    <section className="py-24 bg-[#111827] relative overflow-hidden">
      {/* Dark futuristic background vibe */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/50 text-blue-300 font-medium text-sm mb-6 border border-blue-500/30">
            <BrainCircuit className="w-4 h-4" />
            Next-Gen Capabilities
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Innovation that keeps you <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Ahead</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Stop using legacy software. Step into the future of education management with our suite of advanced, AI-ready tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div key={idx} className={`p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300 group ${idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvancedFeatures;
