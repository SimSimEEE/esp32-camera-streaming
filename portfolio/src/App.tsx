/**
 * `App.tsx`
 * - Main portfolio application component
 *
 * @author      Sim Si-Myeong <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { Hero } from './components/Hero';
import { CareerTimeline } from './components/CareerTimeline';
import { ProjectCards } from './components/ProjectCards';
import { IoTDashboard } from './components/IoTDashboard';
import { TechStack } from './components/TechStack';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Hero />
      <CareerTimeline />
      <ProjectCards />
      <IoTDashboard />
      <TechStack />
      <Contact />
      <Footer />
    </div>
  );
};

export default App;
