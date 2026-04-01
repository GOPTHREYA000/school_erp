import React from 'react';
import { ShieldCheck, TrendingUp, Cpu, ArrowRight, PlayCircle } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative bg-[#0B1F3A] overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-transparent z-0"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Left Column: Copy & CTAs */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-6">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Built for Multi-School Management
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
              Run Your Entire School System from <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">One Powerful Platform</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl leading-relaxed">
              Manage academics, fees, staff, transport, and communication — all in one unified ERP built for modern school groups.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2 group">
                Request Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold text-lg transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
                <PlayCircle className="w-5 h-5" />
                View Features
              </button>
            </div>
            
            <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 pt-6 border-t border-white/10 w-full">
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span>Scalable</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <Cpu className="w-5 h-5 text-blue-400" />
                <span>AI-Ready</span>
              </div>
            </div>
          </div>
          
          {/* Right Column: Dashboard Mockup */}
          <div className="w-full lg:w-1/2 perspective-1000">
            <div className="relative rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-2 transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-all duration-700 ease-out group">
              {/* Mockup Top Bar */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-gray-900/50 rounded-t-xl">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              
              {/* Dashboard Content Fake UI */}
              <div className="bg-[#111827] rounded-b-xl overflow-hidden aspect-video flex flex-col p-4 gap-4">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="h-6 w-32 bg-white/10 rounded-md"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20"></div>
                    <div className="h-8 w-24 bg-blue-600/80 text-xs text-white/90 flex items-center justify-center rounded-md font-medium">Add Branch</div>
                  </div>
                </div>
                
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="h-3 w-16 bg-white/20 rounded mb-2"></div>
                    <div className="h-6 w-24 bg-white/10 rounded"></div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="h-3 w-16 bg-white/20 rounded mb-2"></div>
                    <div className="h-6 w-24 bg-white/10 rounded"></div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="h-3 w-16 bg-white/20 rounded mb-2"></div>
                    <div className="h-6 w-24 bg-white/10 rounded"></div>
                  </div>
                </div>
                
                {/* Chart Area */}
                <div className="flex-1 bg-white/5 rounded-lg border border-white/5 p-4 flex flex-col">
                  <div className="h-4 w-32 bg-white/20 rounded mb-auto"></div>
                  <div className="mt-auto flex items-end justify-between h-20 gap-2">
                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                      <div key={i} className="w-full bg-blue-500/30 rounded-t-sm" style={{ height: `${h}%` }}>
                        <div className="w-full bg-blue-400/80 rounded-t-sm" style={{ height: '2px' }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating element for depth */}
              <div className="absolute -right-6 -bottom-6 bg-white p-4 rounded-xl shadow-xl shadow-black/50 border border-gray-100 transform translate-z-10 group-hover:translate-y-[-10px] transition-transform duration-500">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg text-green-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Fee Collection</div>
                    <div className="text-sm font-bold text-gray-900">+24.5% Today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default Hero;
