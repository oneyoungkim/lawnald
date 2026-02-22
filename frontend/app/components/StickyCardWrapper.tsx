"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface StickyCardWrapperProps {
    children: React.ReactNode;
    index: number;
    total: number;
}

export default function StickyCardWrapper({ children, index, total }: StickyCardWrapperProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scroll progress of this card's container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        // "start start" = when top of element hits top of viewport
        // "end start" = when bottom of element hits top of viewport
        offset: ["start start", "end start"],
    });

    // When scrolling past this card (progress ~0.6→1), scale down and dim
    const scale = useTransform(scrollYProgress, [0.4, 0.85], [1, 0.95]);
    const brightness = useTransform(scrollYProgress, [0.4, 0.85], [1, 0.7]);
    const filter = useTransform(brightness, (v) => `brightness(${v})`);

    // Each card stacks slightly lower than the previous
    const stickyTop = 80 + index * 14;

    return (
        <div
            ref={containerRef}
            className="relative"
            style={{
                // Enough scroll room for the sticky effect to work.
                // Last card doesn't need extra space.
                minHeight: index < total - 1 ? "85vh" : "auto",
                zIndex: 10 + index,
            }}
        >
            <motion.div
                className="sticky"
                style={{
                    top: `${stickyTop}px`,
                    scale,
                    filter,
                    transformOrigin: "top center",
                }}
            >
                {children}
            </motion.div>
        </div>
    );
}
