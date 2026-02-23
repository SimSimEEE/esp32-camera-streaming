/**
 * `Hero.tsx`
 * - Portfolio hero section with animated gradient background
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { Github, Mail, Phone } from "lucide-react";

export const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-950/20 to-gray-950">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxZTQwYWYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEyYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMmMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 section-container text-center">
                <div className="mb-6">
                    <span className="inline-block px-4 py-2 bg-primary-900/30 border border-primary-700/50 rounded-full text-primary-400 text-sm font-medium">
                        Microservice & System Integration Specialist
                    </span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                    전기 회로에서
                    <br />
                    마이크로서비스까지
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 mb-4">
                    시스템 통합 전문가{" "}
                    <span className="text-primary-400 font-semibold">심우근</span>
                </p>

                <p className="text-base text-gray-500 mb-6">
                    엔지니어의 정밀함 × 개발자의 확장성
                </p>

                {/* Tech / Domain Tags */}
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto mb-12">
                    {[
                        "TypeScript", "Node.js", "Java",
                        "AWS Lambda", "DynamoDB", "Elasticsearch",
                        "WebSocket", "Docker", "MSA",
                        "REST API", "Python", "ESP32",
                    ].map((tag) => (
                        <span
                            key={tag}
                            className="px-3 py-1 bg-gray-800/60 border border-gray-700/50 text-gray-400 text-sm rounded-full font-mono hover:border-primary-600/50 hover:text-primary-400 transition-colors"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <a
                        href="#projects"
                        className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-primary-900/50 hover:shadow-primary-800/50"
                    >
                        프로젝트 보기
                    </a>
                    <a
                        href="#contact"
                        className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold border border-gray-700 transition-all duration-300"
                    >
                        연락하기
                    </a>
                </div>

                {/* Contact Icons */}
                <div className="flex gap-6 justify-center text-gray-400">
                    <a
                        href="mailto:smileteeth14@gmail.com"
                        className="hover:text-primary-400 transition-colors"
                        aria-label="Email"
                    >
                        <Mail size={24} />
                    </a>
                    <a
                        href="https://github.com/SimSimEEE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary-400 transition-colors"
                        aria-label="GitHub"
                    >
                        <Github size={24} />
                    </a>
                    <a
                        href="tel:+821026678213"
                        className="hover:text-primary-400 transition-colors"
                        aria-label="Phone"
                    >
                        <Phone size={24} />
                    </a>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-gray-600 rounded-full p-1">
                    <div className="w-1 h-2 bg-gray-400 rounded-full mx-auto animate-pulse-slow"></div>
                </div>
            </div>
        </section>
    );
};
