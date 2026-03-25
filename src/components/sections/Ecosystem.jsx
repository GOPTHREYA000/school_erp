import React from 'react';
import { Smartphone, Monitor, BookOpen, UserCircle2 } from 'lucide-react';

const Ecosystem = () => {
  const platforms = [
    {
      role: 'Parents',
      icon: <Smartphone className="w-8 h-8" />,
      title: "Parent App",
      desc: "Live updates, fee payments, and direct communication in their pocket.",
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      role: 'Teachers',
      icon: <BookOpen className="w-8 h-8" />,
      title: "Teacher App",
      desc: "Fast attendance, grading, and syllabus tracking on the go.",
      color: "bg-purple-50 text-purple-600 border-purple-100"
    },
    {
      role: 'Staff',
      icon: <Monitor className="w-8 h-8" />,
      title: "Admin Panel",
      desc: "Complete operational control of academics, HR, and inventory.",
      color: "bg-green-50 text-green-600 border-green-100"
    },
    {
      role: 'Management',
      icon: <UserCircle2 className="w-8 h-8" />,
      title: "Management Dashboard",
      desc: "High-level insights, branch comparisons, and financial reports.",
      color: "bg-orange-50 text-orange-600 border-orange-100"
    }
  ];

  return (
    <section className="py-24 bg-[#0B1F3A] relative overflow-hidden" id="ecosystem">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
            A Multi-Platform <span className="text-blue-400">Ecosystem</span>
          </h2>
          <p className="text-blue-100 text-lg">
            Empower every stakeholder with dedicated interfaces designed specifically for their needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors group">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${platform.color} shadow-inner`}>
                {platform.icon}
              </div>
              <div className="text-sm font-bold text-blue-300 tracking-wider uppercase mb-2">For {platform.role}</div>
              <h3 className="text-xl font-bold text-white mb-3">{platform.title}</h3>
              <p className="text-gray-300 leading-relaxed text-sm">
                {platform.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Ecosystem;
