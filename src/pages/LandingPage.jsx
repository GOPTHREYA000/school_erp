import React from 'react';
import Hero from '../components/sections/Hero';
import ProblemSolution from '../components/sections/ProblemSolution';
import CoreModules from '../components/sections/CoreModules';
import FeeManagement from '../components/sections/FeeManagement';
import Ecosystem from '../components/sections/Ecosystem';
import MultiSchoolControl from '../components/sections/MultiSchoolControl';
import AdvancedFeatures from '../components/sections/AdvancedFeatures';
import Security from '../components/sections/Security';
import DevelopmentApproach from '../components/sections/DevelopmentApproach';
import CtaSection from '../components/sections/CtaSection';

const LandingPage = () => {
  return (
    <div className="w-full">
      <Hero />
      <ProblemSolution />
      <CoreModules />
      <FeeManagement />
      <Ecosystem />
      <MultiSchoolControl />
      <AdvancedFeatures />
      <Security />
      <DevelopmentApproach />
      <CtaSection />
    </div>
  );
};

export default LandingPage;
