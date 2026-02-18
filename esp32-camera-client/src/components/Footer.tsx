/**
 * `Footer.tsx`
 * - Footer component with copyright and links
 *
 * @author      Sim Si-Myeong <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="section-container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-gray-500 text-sm">
            <p className="flex items-center gap-2">
              © 2026 SimSimEEE. Made with <Heart className="w-4 h-4 text-red-500 inline" /> and React + Tailwind CSS
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#career" className="hover:text-primary-400 transition-colors">
              Career
            </a>
            <a href="#projects" className="hover:text-primary-400 transition-colors">
              Projects
            </a>
            <a href="#skills" className="hover:text-primary-400 transition-colors">
              Skills
            </a>
            <a href="#contact" className="hover:text-primary-400 transition-colors">
              Contact
            </a>
          </div>
        </div>

        {/* Tech Notice */}
        <div className="mt-6 text-center text-xs text-gray-600">
          <p>🚀 Portfolio v1.0.0 | Powered by Vite + React + TypeScript</p>
        </div>
      </div>
    </footer>
  );
};
