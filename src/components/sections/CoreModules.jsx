import React from 'react';
import { Users, IndianRupee, Bus, UserCircle, BookOpen, GraduationCap, MessageSquare, Receipt, Package, LineChart, ArrowRight } from 'lucide-react';

const CoreModules = () => {
  const modules = [
    { icon: <Users className="w-8 h-8" />, title: "Student Information", desc: "Complete 360° view of student profiles, history, and progression.", highlight: false },
    { icon: <IndianRupee className="w-8 h-8" />, title: "Fee Management", desc: "Automated collections, smart reminders, and zero revenue leakage.", highlight: true },
    { icon: <Bus className="w-8 h-8" />, title: "Transport Management", desc: "Live GPS tracking, route optimization, and automated alerts.", highlight: false },
    { icon: <UserCircle className="w-8 h-8" />, title: "Staff & HR", desc: "Effortless payroll, attendance tracking, and performance reviews.", highlight: false },
    { icon: <BookOpen className="w-8 h-8" />, title: "Academic Management", desc: "Timetable generation, syllabus tracking, and online assignments.", highlight: false },
    { icon: <GraduationCap className="w-8 h-8" />, title: "Examination & Results", desc: "Custom report cards, grade analysis, and instant publishing.", highlight: false },
    { icon: <MessageSquare className="w-8 h-8" />, title: "Communication System", desc: "Instant SMS, email, and app notifications to parents.", highlight: false },
    { icon: <Receipt className="w-8 h-8" />, title: "Accounts & Finance", desc: "Real-time ledger, expense tracking, and instant P&L reports.", highlight: false },
    { icon: <Package className="w-8 h-8" />, title: "Inventory Management", desc: "Track uniforms, books, and lab equipment across all branches.", highlight: false },
    { icon: <LineChart className="w-8 h-8" />, title: "Analytics Dashboard", desc: "Bird's eye view of admissions, revenue, and daily operations.", highlight: false }
  ];

  return (
    <section className="py-24 bg-[#F5F7FA]" id="modules">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1F3A] mb-6">
            Everything You Need to Run a <span className="text-blue-600">Premium Institution</span>
          </h2>
          <p className="text-lg text-gray-600">
            A fully integrated suite of modules designed to eliminate manual work and empower administrators with complete control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {modules.map((mod, idx) => (
            <div 
              key={idx} 
              className={`relative rounded-2xl p-6 transition-all duration-300 group hover:-translate-y-1 ${
                mod.highlight 
                ? 'bg-[#0B1F3A] text-white shadow-xl shadow-blue-900/20 border border-blue-800' 
                : 'bg-white text-gray-900 shadow-sm hover:shadow-md border border-gray-100 hover:border-blue-100'
              }`}
            >
              {mod.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                  Most Popular
                </div>
              )}
              
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
                mod.highlight ? 'bg-blue-600/30 text-blue-400' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors'
              }`}>
                {mod.icon}
              </div>
              
              <h3 className={`text-lg font-bold mb-3 ${mod.highlight ? 'text-white' : 'text-gray-900'}`}>
                {mod.title}
              </h3>
              
              <p className={`text-sm leading-relaxed mb-6 ${mod.highlight ? 'text-blue-100' : 'text-gray-500'}`}>
                {mod.desc}
              </p>
              
              <button className={`mt-auto flex items-center gap-1 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity ${mod.highlight ? 'text-blue-400' : 'text-blue-600'}`}>
                Explore Module <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreModules;
