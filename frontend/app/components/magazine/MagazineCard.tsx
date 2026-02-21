"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { ArrowRight, User } from "lucide-react";

interface Article {
    id: string;
    lawyer_id: string;
    lawyer_name: string;
    lawyer_firm: string;
    lawyer_image?: string;
    type: string;
    title: string;
    emotional_title?: string; // New field
    summary: string;
    emotional_summary?: string; // New field
    date: string;
    tags: string[];
    category_label?: string;
    key_issues?: string[];
    result_summary?: string;
    duration?: string;
    cover_image?: string; // Potential specific image
}

interface MagazineCardProps {
    article: Article;
    index: number;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
    "승소사례": "bg-gradient-to-br from-blue-50 to-indigo-50",
    "성범죄": "bg-gradient-to-br from-slate-50 to-slate-200",
    "이혼": "bg-gradient-to-br from-rose-50 to-orange-50",
    "부동산": "bg-gradient-to-br from-emerald-50 to-teal-50",
    "손해배상": "bg-gradient-to-br from-amber-50 to-yellow-50",
    "default": "bg-gradient-to-br from-gray-50 to-gray-100"
};

const CATEGORY_IMAGES: Record<string, string> = {
    "성범죄": "/images/magazine/criminal.jpg", // Placeholder paths
    "이혼": "/images/magazine/divorce.jpg",
    "부동산": "/images/magazine/realestate.jpg",
};


export default function MagazineCard({ article, index }: MagazineCardProps) {
    // Content Logic: Prioritize emotional content
    const title = article.emotional_title || article.title;
    const summary = article.emotional_summary || article.summary;
    const category = article.category_label || (article.tags && article.tags[0]) || "승소사례";

    // Visual Logic
    const gradientClass = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS["default"];

    // Image Error Handling
    const [imgError, setImgError] = React.useState(false);
    const [lawyerImgError, setLawyerImgError] = React.useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
            className="group h-full"
        >
            <Link href={`/magazine/${article.id}`} className="block h-full">
                <article className="h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100/50">

                    {/* Thumbnail Area */}
                    <div className={`h-48 w-full relative overflow-hidden ${gradientClass} flex items-center justify-center`}>
                        {article.cover_image && !imgError ? (
                            <Image
                                src={article.cover_image}
                                alt={title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={() => setImgError(true)}
                                unoptimized
                            />
                        ) : (
                            /* Fallback to gradient/icon if no image or error */
                            <div className="flex flex-col items-center justify-center opacity-30 text-gray-500">
                                <span className="font-serif font-bold text-3xl mb-1">Lawnald</span>
                                <span className="text-[10px] uppercase tracking-widest">Premium Archive</span>
                            </div>
                        )}

                        {/* Badge */}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm border border-point/20 text-main z-10">
                            {article.type === "case" ? "성공사례" : "법률칼럼"}
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex gap-2 mb-3">
                            {article.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-xs font-bold text-point bg-point/10 px-2 py-1 rounded">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <h3 className="text-[19px] font-serif font-bold text-main leading-snug mb-3 group-hover:text-point transition-colors line-clamp-2">
                            {article.title}
                        </h3>
                        <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 mb-6 h-10">
                            {article.summary}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-point/10">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-zinc-200 relative overflow-hidden">
                                    {article.lawyer_image && !lawyerImgError ? (
                                        <img
                                            src={article.lawyer_image}
                                            alt={article.lawyer_name}
                                            className="w-full h-full object-cover"
                                            onError={() => setLawyerImgError(true)}
                                        />
                                    ) : (
                                        <User className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[#1d1d1f]">{article.lawyer_name} 변호사</span>
                                    <span className="text-xs text-gray-400">{article.date}</span>
                                </div>
                            </div>

                            {/* Arrow Icon */}
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </article>
            </Link>
        </motion.div>
    );
}
