// src/services/fallbackEntityService.ts
/**
 * Fallback entity recognition service when spaCy is unavailable
 * Uses regex patterns to identify common entity types
 */

export interface RecognizedEntity {
    text: string;
    label: string;
    sentences: string[];
}

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
 * Extract entities using regex patterns
 */
export const extractEntitiesWithRegex = (text: string): RecognizedEntity[] => {
    console.log('Using regex-based entity extraction');
    const sentences = extractSentences(text);
    const entities: RecognizedEntity[] = [];

    // Entity patterns with examples
    const entityPatterns = [
        // People
        {
            regex: /\b(?:[A-Z][a-z]+ ){1,2}(?:[A-Z][a-z]+)\b/g,
            label: 'PERSON',
            examples: ['John Smith', 'Mary Johnson', 'Robert Williams']
        },

        // Organizations
        {
            regex: /\b(?:[A-Z][a-z]+ ){0,3}(?:Inc\.|Corp\.|LLC|Company|Ltd\.|Group|Association|University|College|Institute)\b/g,
            label: 'ORG',
            examples: ['Apple Inc.', 'Microsoft Corporation', 'Harvard University']
        },

        // Locations
        {
            regex: /\b(?:[A-Z][a-z]+(?: [A-Z][a-z]+){0,2}(?:, [A-Z][a-z]+)?)\b(?= is| was| has| had| will| would| city| country| state| region| area)/g,
            label: 'LOC',
            examples: ['New York', 'Paris, France', 'California']
        },

        // Dates
        {
            regex: /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.] ?\d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?/g,
            label: 'DATE',
            examples: ['January 1, 2022', 'Dec. 25', 'March 15th, 2023']
        },
        {
            regex: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
            label: 'DATE',
            examples: ['01/01/2022', '12/25/21', '5/15/2023']
        },

        // Money
        {
            regex: /\b\$\d+(?:,\d+)*(?:\.\d+)?(?:[ ]?(?:million|billion|trillion))?\b/g,
            label: 'MONEY',
            examples: ['$100', '$1,000,000', '$5.3 billion']
        },

        // Quantities
        {
            regex: /\b\d+(?:\.\d+)?[ ]?(?:kg|MB|GB|TB|meters|miles|km|pounds|tons|bytes|seconds|minutes|hours|days|weeks|months|years)\b/g,
            label: 'QUANTITY',
            examples: ['5 kg', '3.5 miles', '2 hours', '500 MB']
        },

        // Percentages
        {
            regex: /\b\d+(?:\.\d+)?[ ]?(?:percent|%)\b/g,
            label: 'PERCENT',
            examples: ['10%', '3.5 percent', '99.9%']
        },

        // Titles with names
        {
            regex: /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|President|CEO|Director|Senator|Governor|Mayor|Sir|Lady|Lord)[ ](?:[A-Z][a-z]+(?:[ ][A-Z][a-z]+){0,2})\b/g,
            label: 'PERSON',
            examples: ['Dr. Jane Smith', 'President Joe Biden', 'CEO Elon Musk']
        },

        // Countries
        {
            regex: /\b(?:United States|Canada|Mexico|Brazil|Argentina|United Kingdom|France|Germany|Italy|Spain|China|Japan|India|Australia|Russia|South Africa)\b/g,
            label: 'GPE',
            examples: ['United States', 'China', 'United Kingdom']
        },

        // Products
        {
            regex: /\b(?:iPhone|iPad|MacBook|Galaxy|Pixel|Windows|macOS|Android|iOS|Tesla Model [SX3Y]|PlayStation \d|Xbox)\b/g,
            label: 'PRODUCT',
            examples: ['iPhone', 'Windows', 'Tesla Model S']
        }
    ];

    // Build a map of entities to avoid duplicates
    const entityMap: Record<string, RecognizedEntity> = {};

    // Extract entities using patterns
    entityPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(text)) !== null) {
            const entityText = match[0];
            const key = `${entityText.toLowerCase()}_${pattern.label}`;

            if (!entityMap[key]) {
                // Find sentences containing this entity
                const matchingSentences = sentences.filter(
                    s => s.toLowerCase().includes(entityText.toLowerCase())
                ).slice(0, 5); // Limit to 5 sentences for readability

                if (matchingSentences.length > 0) {
                    entityMap[key] = {
                        text: entityText,
                        label: pattern.label,
                        sentences: matchingSentences
                    };
                }
            }
        }
    });

    // Get capitalized multi-word phrases as potential entities
    const capitalizedPhraseRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    let phraseMatch;
    while ((phraseMatch = capitalizedPhraseRegex.exec(text)) !== null) {
        const phrase = phraseMatch[0];

        // Skip if this phrase is already captured by other patterns
        const isAlreadyCaptured = Object.values(entityMap).some(
            entity => entity.text.toLowerCase() === phrase.toLowerCase()
        );

        if (!isAlreadyCaptured) {
            const key = `${phrase.toLowerCase()}_ORG`;

            // Find sentences containing this phrase
            const matchingSentences = sentences.filter(
                s => s.includes(phrase)
            );

            if (matchingSentences.length > 0) {
                entityMap[key] = {
                    text: phrase,
                    label: 'ORG', // Assume multi-word capitalized phrases are organizations
                    sentences: matchingSentences
                };
            }
        }
    }

    // Get single capitalized words if we don't have enough entities
    if (Object.keys(entityMap).length < 5) {
        const capitalizedWordRegex = /\b[A-Z][a-z]{3,}\b/g;
        let wordMatch;
        while ((wordMatch = capitalizedWordRegex.exec(text)) !== null) {
            const word = wordMatch[0];

            // Skip if this word is part of already captured entities
            const isPartOfExisting = Object.values(entityMap).some(
                entity => entity.text.toLowerCase().includes(word.toLowerCase())
            );

            if (!isPartOfExisting) {
                const key = `${word.toLowerCase()}_MISC`;

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

    return Object.values(entityMap);
};

/**
 * Generate fake entities for testing
 */
export const generateFakeEntities = (text: string): RecognizedEntity[] => {
    const sentences = extractSentences(text);

    // Create some fake entities based on the text length
    const fakeEntities = [
        { text: "John Smith", label: "PERSON", sentences: [] },
        { text: "Apple Inc.", label: "ORG", sentences: [] },
        { text: "New York", label: "LOC", sentences: [] },
        { text: "January 15, 2023", label: "DATE", sentences: [] },
        { text: "$5 million", label: "MONEY", sentences: [] },
        { text: "Microsoft", label: "ORG", sentences: [] },
        { text: "Dr. Emily Johnson", label: "PERSON", sentences: [] },
        { text: "United States", label: "GPE", sentences: [] }
    ];

    // Assign random sentences to each entity
    return fakeEntities.map(entity => {
        // Pick 1-3 random sentences
        const numSentences = Math.floor(Math.random() * 3) + 1;
        const entitySentences = [];

        for (let i = 0; i < numSentences && sentences.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * sentences.length);
            entitySentences.push(sentences[randomIndex]);
        }

        return {
            ...entity,
            sentences: entitySentences
        };
    });
};

export default {
    extractEntitiesWithRegex,
    generateFakeEntities
};