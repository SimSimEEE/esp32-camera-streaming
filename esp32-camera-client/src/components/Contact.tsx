/**
 * `Contact.tsx`
 * - Contact information section
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { Mail, Phone, Github, MapPin } from "lucide-react";

export const Contact = () => {
    return (
        <section
            id="contact"
            className="section-container bg-gradient-to-b from-gray-900 to-gray-950"
        >
            <h2 className="section-title">
                Get In <span className="text-primary-400">Touch</span>
            </h2>

            <div className="max-w-4xl mx-auto">
                <p className="text-center text-gray-400 mb-12 text-lg tracking-wide">
                    새로운 도전, 기술적인 아키텍처 논의, 협업 제안 —{" "}
                    <span className="text-gray-200">언제든 환영합니다.</span>
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
                            하드웨어의 정밀함으로 소프트웨어의 확장성을 설계합니다.
                        </h3>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            전기설계 엔지니어로서 체득한 무결성에 대한 집요함을 백엔드 아키텍처에
                            녹여냅니다.
                            <br />
                            안정적인 회로가 도시의 전력을 책임지듯, 견고하고 유연한 MSA를 통해
                            <br />
                            비즈니스의 지속 가능성을 뒷받침합니다.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
