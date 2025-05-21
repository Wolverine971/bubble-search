// src/components/common/MarkdownRenderer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Entity } from '../../types/search';

// Optional CSS imports for code highlighting (if using rehype-highlight)
// import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
    content: string;
    selectedEntity?: Entity | null;
    className?: string;
}

/**
 * Highlights entity mentions in text.
 * @param text The text to process
 * @param entity The entity to highlight
 * @returns Text with entity mentions highlighted with HTML spans
 */
const highlightEntityInText = (text: string, entity: Entity | null): string => {
    if (!entity || !text) return text || '';

    try {
        // Case-insensitive regex with word boundaries
        const regex = new RegExp(`\\b(${entity.text})\\b`, 'gi');
        return text.replace(regex, '<span class="bg-yellow-200 rounded px-0.5">$1</span>');
    } catch (e) {
        console.warn("Regex error in highlightEntityInText:", e);
        return text;
    }
};

/**
 * A reusable Markdown renderer component with consistent left alignment
 * and optional entity highlighting.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
    content,
    selectedEntity = null,
    className = ""
}) => {
    // Process content for entity highlighting if an entity is selected
    const processedContent = selectedEntity
        ? highlightEntityInText(content, selectedEntity)
        : content;

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            // className={`text-left w-full ${className}`}
            components={{
                // Headings with consistent left alignment and spacing
                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-5 mb-3 text-left" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-4 mb-2 text-left" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-3 mb-2 text-left" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-base font-bold mt-3 mb-1 text-left" {...props} />,
                h5: ({ node, ...props }) => <h5 className="text-sm font-bold mt-2 mb-1 text-left" {...props} />,
                h6: ({ node, ...props }) => <h6 className="text-xs font-bold mt-2 mb-1 text-left" {...props} />,

                // Lists with proper left alignment
                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-3 text-left" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-3 text-left" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1 text-left" {...props} />,

                // Paragraphs with consistent spacing
                p: ({ node, ...props }) => <p className="mb-3 text-left" {...props} />,

                // Links with clear styling
                a: ({ node, href, ...props }) => (
                    <a
                        href={href}
                        className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                    />
                ),

                // Blockquotes with left border
                blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-3 py-1 my-3 italic text-left text-gray-700" {...props} />
                ),

                // Code blocks with better visibility
                code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                        <div className="mb-3 w-full">
                            <code
                                className={`${match ? `language-${match[1]}` : ''} block bg-gray-100 rounded p-3 overflow-x-auto text-sm text-left w-full`}
                                {...props}
                            >
                                {children}
                            </code>
                        </div>
                    ) : (
                        <code className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono" {...props}>
                            {children}
                        </code>
                    );
                },

                // Table styling with left-aligned content
                table: ({ node, ...props }) => (
                    <div className="overflow-x-auto mb-4 w-full">
                        <table className="min-w-full divide-y divide-gray-200 border-collapse text-left" {...props} />
                    </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
                tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-200" {...props} />,
                tr: ({ node, ...props }) => <tr className="text-left" {...props} />,
                th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />,
                td: ({ node, ...props }) => <td className="px-3 py-2 text-left text-sm" {...props} />,

                // Horizontal rule
                hr: ({ node, ...props }) => <hr className="my-4 border-t border-gray-200" {...props} />,

                // Entity highlighting
                span: ({ node, className, ...props }) => {
                    if (className?.includes('bg-yellow-200')) {
                        return <span className="bg-yellow-200 rounded px-0.5" {...props} />;
                    }
                    return <span className="text-left" {...props} />;
                },

                // Image styling
                img: ({ node, alt, ...props }) => (
                    <img
                        className="max-w-full h-auto rounded my-3"
                        alt={alt || ""}
                        loading="lazy"
                        {...props}
                    />
                ),

                // Other text formatting
                strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                em: ({ node, ...props }) => <em className="italic" {...props} />
            }}
        >
            {processedContent}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;