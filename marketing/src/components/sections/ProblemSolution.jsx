import React from 'react';
import { AlertCircle, Link, IndianRupee, MessageSquareX, BarChart3, CheckCircle2, Workflow, BellPlus, Layers } from 'lucide-react';

const ProblemSolution = () => {
  const problems = [
    { icon: <Link className="w-6 h-6" />, title: "Disconnected Systems", desc: "Data scattered across multiple tools and spreadsheets." },
    { icon: <IndianRupee className="w-6 h-6" />, title: "Manual Fee Tracking", desc: "Endless reconciliation causing delayed collections." },
    { icon: <MessageSquareX className="w-6 h-6" />, title: "Poor Communication", desc: "Parents left in the dark, leading to complaints." },
    { icon: <BarChart3 className="w-6 h-6" />, title: "Lack of Analytics", desc: "Decisions made on assumptions, not hard data." }
  ];

  const solutions = [
    { icon: <Layers className="w-8 h-8" />, title: "One Centralized Platform", desc: "Everything from admissions to finance in a single ecosystem." },
    { icon: <CheckCircle2 className="w-8 h-8" />, title: "Real-time Control", desc: "Instantly view the status of every branch and department." },
    { icon: <Workflow className="w-8 h-8" />, title: "Automated Workflows", desc: "Reduce 80% of admin tasks with intelligent automation." },
    { icon: <BellPlus className="w-8 h-8" />, title: "Smart Insights", desc: "Actionable dashboards powered by live data." }
  ];

  return (
    <section className="py-24 bg-white" id="problem-solution">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Problems Grid */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 font-medium text-sm mb-6 border border-red-100">
            <AlertCircle className="w-4 h-4" />
            The Old Way
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Struggling with fragmented operations?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((prob, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left hover:border-red-200 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-red-100/50 text-red-500 flex items-center justify-center mb-4">
                  {prob.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{prob.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{prob.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transition */}
        <div className="py-16 text-center transform -translate-y-4">
          <div className="h-16 w-[2px] bg-gradient-to-b from-red-200 via-gray-300 to-blue-500 mx-auto mb-8"></div>
          <h2 className="text-4xl font-extrabold text-[#0B1F3A] mb-8">
            What if everything worked together <span className="text-blue-600">seamlessly?</span>
          </h2>
        </div>

        {/* Solutions Grid */}
        <div className="bg-gradient-to-br from-[#F5F7FA] to-white rounded-[2rem] p-8 md:p-12 border border-blue-50 shadow-xl shadow-blue-900/5 relative overflow-hidden">
          {/* subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {solutions.map((sol, idx) => (
              <div key={idx} className="flex gap-6 items-start group">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-md transition-all">
                  {sol.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{sol.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">{sol.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default ProblemSolution;
