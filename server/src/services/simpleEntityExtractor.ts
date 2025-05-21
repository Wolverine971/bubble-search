// src/services/simpleEntityExtractor.ts
/**
 * A simple, self-contained entity extractor that works without any dependencies
 * Used as a fallback when the spaCy server is unavailable
 */

import { RecognizedEntity } from "../types/search";



/**
 * Extract sentences from text
 */
export const extractSentences = (text: string): string[] => {
    return text
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 0)
        .map(s => s.trim());
};

/**
 * Simple regex-based entity extraction
 */
export const extractEntities = (text: string): RecognizedEntity[] => {
    const sentences = extractSentences(text);

    // Map to store entities and prevent duplicates
    const entityMap: Record<string, RecognizedEntity> = {};

    // Patterns for common entity types
    const patterns = [
        // People - Match capitalized names like "John Smith"
        {
            pattern: /\b(?:[A-Z][a-z]+ ){1,2}(?:[A-Z][a-z]+)\b/g,
            label: 'PERSON'
        },

        // Organizations - Match company names with common suffixes
        {
            pattern: /\b(?:[A-Z][a-z]+ ){0,2}(?:Inc\.|Corp\.|LLC|Company|Ltd\.)\b/g,
            label: 'ORG'
        },

        // Organizations without suffixes - Match capitalized multi-word phrases
        {
            pattern: /\b(?:[A-Z][a-z]+ ){1,3}(?:Group|Association|University|College|Institute|Organization)\b/g,
            label: 'ORG'
        },

        // Locations - Match capitalized place names
        {
            pattern: /\b[A-Z][a-z]+(?:, [A-Z][a-z]+)?\b/g,
            label: 'LOC'
        },

        // Dates - Match formatted dates
        {
            pattern: /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?) \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b/g,
            label: 'DATE'
        },
        {
            pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
            label: 'DATE'
        },

        // Years
        {
            pattern: /\b(19|20)\d{2}\b/g,
            label: 'DATE'
        },

        // Money - Match currency amounts
        {
            pattern: /\b\$\d+(?:,\d+)*(?:\.\d+)?(?:[ ]?(?:million|billion|trillion))?\b/g,
            label: 'MONEY'
        },

        // Percentages
        {
            pattern: /\b\d+(?:\.\d+)?%\b/g,
            label: 'PERCENT'
        },

        // Email addresses
        {
            pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
            label: 'EMAIL'
        },

        // URLs
        {
            pattern: /\bhttps?:\/\/[^\s]+\b/g,
            label: 'URL'
        }
    ];

    // Process each pattern
    for (const { pattern, label } of patterns) {
        // Need to create a new RegExp for each execution since we're using /g flag
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;

        while ((match = regex.exec(text)) !== null) {
            const entityText = match[0];
            const key = `${entityText.toLowerCase()}_${label}`;

            if (!entityMap[key]) {
                // Find sentences containing this entity
                const matchingSentences = sentences.filter(
                    s => s.toLowerCase().includes(entityText.toLowerCase())
                );

                if (matchingSentences.length > 0) {
                    entityMap[key] = {
                        text: entityText,
                        label,
                        sentences: matchingSentences
                    };
                }
            }
        }
    }

    // Process capitalized single words as potential entities
    // (only if we don't have many entities yet)
    if (Object.keys(entityMap).length < 5) {
        const wordRegex = /\b[A-Z][a-z]{3,}\b/g;
        let match;

        while ((match = wordRegex.exec(text)) !== null) {
            const word = match[0];
            // Skip if this word is already part of an existing entity
            const isPartOfEntity = Object.values(entityMap).some(entity =>
                entity.text.includes(word)
            );

            if (!isPartOfEntity) {
                const key = `${word.toLowerCase()}_MISC`;

                if (!entityMap[key]) {
                    // Find sentences containing this word
                    const matchingSentences = sentences.filter(
                        s => s.includes(word)
                    );

                    if (matchingSentences.length > 0) {
                        entityMap[key] = {
                            text: word,
                            label: 'MISC',
                            sentences: matchingSentences
                        };
                    }
                }
            }
        }
    }

    return Object.values(entityMap);
};

/**
 * Generate fake entities for testing
 */
export const generateFakeEntities = (text: string): RecognizedEntity[] => {
    const sentences = extractSentences(text);
    if (sentences.length === 0) {
        sentences.push("No context available.");
    }

    // Create some fake entities
    return [
        { text: "John Smith", label: "PERSON", sentences: sentences.slice(0, 1) },
        { text: "Apple Inc.", label: "ORG", sentences: sentences.slice(0, 1) },
        { text: "New York", label: "LOC", sentences: sentences.slice(0, 1) },
        { text: "January 15, 2023", label: "DATE", sentences: sentences.slice(0, 1) },
        { text: "$5 million", label: "MONEY", sentences: sentences.slice(0, 1) }
    ];
};

export default {
    extractEntities,
    generateFakeEntities,
    extractSentences
};