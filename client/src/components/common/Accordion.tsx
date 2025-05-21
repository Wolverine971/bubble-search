// src/components/common/Accordion.tsx
import React, { ReactNode, useState } from 'react';

interface AccordionProps {
    title: string;
    children: ReactNode;
    badgeText?: string;
    defaultOpen?: boolean;
    className?: string;
}

const Accordion: React.FC<AccordionProps> = ({
    title,
    children,
    badgeText,
    defaultOpen = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`border border-gray-200 rounded-lg overflow-hidden mb-4 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                aria-expanded={isOpen}
            >
                <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-700">
                        {title}
                        {badgeText && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {badgeText}
                            </span>
                        )}
                    </h3>
                </div>
                <svg
                    className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="p-4 bg-white animate-fadeIn">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Accordion;