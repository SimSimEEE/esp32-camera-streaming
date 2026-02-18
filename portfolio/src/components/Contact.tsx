/**
 * `Contact.tsx`
 * - Contact information section
 *
 * @author      Sim Si-Myeong <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { Mail, Phone, Github, MapPin } from 'lucide-react';

export const Contact = () => {
  return (
    <section id="contact" className="section-container bg-gradient-to-b from-gray-900 to-gray-950">
      <h2 className="section-title">
        Get In <span className="text-primary-400">Touch</span>
      </h2>

      <div className="max-w-4xl mx-auto">
        <p className="text-center text-gray-400 mb-12 text-lg">
          새로운 프로젝트나 협업 기회에 대해 이야기하고 싶으시다면 언제든 연락주세요.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Email */}
          <a
            href="mailto:smileteeth14@gmail.com"
            className="card text-center hover:shadow-xl hover:shadow-primary-900/20 group"
          >
            <div className="w-12 h-12 bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-900/50 transition-colors">
              <Mail className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="font-semibold mb-2 text-white">Email</h3>
            <p className="text-sm text-gray-400 break-all">smileteeth14@gmail.com</p>
          </a>

          {/* Phone */}
          <a
            href="tel:+821026678213"
            className="card text-center hover:shadow-xl hover:shadow-primary-900/20 group"
          >
            <div className="w-12 h-12 bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-900/50 transition-colors">
              <Phone className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="font-semibold mb-2 text-white">Phone</h3>
            <p className="text-sm text-gray-400">+82 10-2667-8213</p>
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/SimSimEEE"
            target="_blank"
            rel="noopener noreferrer"
            className="card text-center hover:shadow-xl hover:shadow-primary-900/20 group"
          >
            <div className="w-12 h-12 bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-900/50 transition-colors">
              <Github className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="font-semibold mb-2 text-white">GitHub</h3>
            <p className="text-sm text-gray-400">@SimSimEEE</p>
          </a>

          {/* Location */}
          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="font-semibold mb-2 text-white">Location</h3>
            <p className="text-sm text-gray-400">Seoul, South Korea</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 card bg-gradient-to-br from-primary-900/10 to-cyan-900/10 border-primary-800/30">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">
              함께 만들어가고 싶습니다
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              전기설계 엔지니어에서 백엔드 개발자로 전향한 저의 여정은 "시스템 사고"의 확장이었습니다.<br />
              정밀한 회로 설계에서 배운 안정성과 MSA 아키텍처의 확장성을 결합하여,<br />
              견고하고 유연한 시스템을 설계합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
