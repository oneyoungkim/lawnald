"use client";

import { motion } from "framer-motion";

interface TypingTextProps {
    text: string;
    className?: string;
    speed?: number;
}

export default function TypingText({ text, className = "", speed = 0.1 }: TypingTextProps) {
    const letters = Array.from(text);

    return (
        <p className={`${className} whitespace-pre-wrap`}>
            {letters.map((letter, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0, delay: index * speed }}
                >
                    {letter}
                </motion.span>
            ))}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                className="inline-block w-[2px] h-[1em] bg-point ml-1 align-bottom mb-0.5"
            />
        </p>
    );
}
