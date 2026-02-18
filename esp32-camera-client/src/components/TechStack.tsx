/**
 * `TechStack.tsx`
 * - Technology stack visualization with categorized skills
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { Code2, Database, Cloud, Layers, Settings, GitBranch } from "lucide-react";

interface Skill {
    name: string;
    level: number;
    color: string;
}

interface SkillCategory {
    category: string;
    icon: typeof Code2;
    skills: Skill[];
    description: string;
}

const techStack: SkillCategory[] = [
    {
        category: "Backend",
        icon: Code2,
        description: "Server-side development & API design",
        skills: [
            { name: "Node.js", level: 90, color: "bg-green-500" },
            { name: "TypeScript", level: 90, color: "bg-blue-500" },
            { name: "Java", level: 75, color: "bg-orange-500" },
            { name: "Spring Boot", level: 70, color: "bg-green-600" },
            { name: "REST API", level: 90, color: "bg-cyan-500" },
        ],
    },
    {
        category: "Database",
        icon: Database,
        description: "Data modeling & optimization",
        skills: [
            { name: "DynamoDB", level: 85, color: "bg-blue-600" },
            { name: "MongoDB", level: 80, color: "bg-green-500" },
            { name: "MySQL", level: 75, color: "bg-blue-400" },
            { name: "Elasticsearch", level: 80, color: "bg-yellow-500" },
        ],
    },
    {
        category: "Cloud & Infrastructure",
        icon: Cloud,
        description: "AWS serverless architecture",
        skills: [
            { name: "AWS Lambda", level: 85, color: "bg-orange-500" },
            { name: "EC2", level: 75, color: "bg-orange-600" },
            { name: "S3", level: 80, color: "bg-orange-400" },
            { name: "SNS/SQS", level: 75, color: "bg-pink-500" },
        ],
    },
    {
        category: "Architecture",
        icon: Layers,
        description: "Design patterns & system design",
        skills: [
            { name: "Microservices", level: 85, color: "bg-purple-500" },
            { name: "Manager Pattern", level: 90, color: "bg-indigo-500" },
            { name: "Proxy Pattern", level: 85, color: "bg-violet-500" },
            { name: "Strategy Pattern", level: 80, color: "bg-fuchsia-500" },
        ],
    },
    {
        category: "DevOps & Tools",
        icon: Settings,
        description: "CI/CD & automation",
        skills: [
            { name: "GitHub Actions", level: 80, color: "bg-gray-700" },
            { name: "Travis CI", level: 75, color: "bg-yellow-600" },
            { name: "Docker", level: 75, color: "bg-blue-500" },
            { name: "Git", level: 90, color: "bg-red-500" },
        ],
    },
    {
        category: "Frontend",
        icon: GitBranch,
        description: "Web development",
        skills: [
            { name: "React.js", level: 80, color: "bg-cyan-400" },
            { name: "JavaScript", level: 85, color: "bg-yellow-400" },
            { name: "Tailwind CSS", level: 75, color: "bg-teal-500" },
        ],
    },
];

export const TechStack = () => {
    return (
        <section id="skills" className="section-container bg-gray-900">
            <h2 className="section-title">
                Tech <span className="text-primary-400">Stack</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {techStack.map((category) => {
                    const Icon = category.icon;
                    return (
                        <div key={category.category} className="card group">
                            {/* Category Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-primary-900/30 rounded-lg group-hover:bg-primary-900/50 transition-colors">
                                    <Icon className="w-6 h-6 text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {category.category}
                                    </h3>
                                    <p className="text-xs text-gray-500">{category.description}</p>
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="space-y-4">
                                {category.skills.map((skill) => (
                                    <div key={skill.name}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-300">
                                                {skill.name}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono">
                                                {skill.level}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full ${skill.color} rounded-full transition-all duration-1000 ease-out`}
                                                style={{ width: `${skill.level}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Highlights */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                    <div className="text-4xl font-bold text-primary-400 mb-2">2+</div>
                    <div className="text-sm text-gray-500">Years Experience</div>
                </div>
                <div className="text-center">
                    <div className="text-4xl font-bold text-primary-400 mb-2">10+</div>
                    <div className="text-sm text-gray-500">Tech Stack</div>
                </div>
                <div className="text-center">
                    <div className="text-4xl font-bold text-primary-400 mb-2">MSA</div>
                    <div className="text-sm text-gray-500">Architecture</div>
                </div>
                <div className="text-center">
                    <div className="text-4xl font-bold text-primary-400 mb-2">AWS</div>
                    <div className="text-sm text-gray-500">Serverless</div>
                </div>
            </div>
        </section>
    );
};
