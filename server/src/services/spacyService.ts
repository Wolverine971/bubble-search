import axios from 'axios';

import simpleEntityExtractor from './simpleEntityExtractor';

// src/services/spacyService.ts - Updated to use Python spaCy server
import 'dotenv/config';
import { RecognizedEntity } from '../types/search';



// Default spaCy server URL - can be set via environment variable
const SPACY_SERVER_URL = process.env.SPACY_SERVER_URL || 'http://127.0.0.1:5001'

// Flag to prevent repeated spaCy server checks if it fails
let serverCheckFailed = false;
let serverLastChecked = 0;
const SERVER_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes

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
 * Check if the spaCy server is available
 */
export const isSpacyServerAvailable = async (): Promise<boolean> => {
    // If we already checked recently, return the cached result
    const now = Date.now();
    if (serverCheckFailed && now - serverLastChecked < SERVER_CHECK_INTERVAL) {
        return false;
    }

    try {
        console.log('Checking spaCy server availability...');
        const response = await axios.get(SPACY_SERVER_URL, { timeout: 2000 });

        if (response.status === 200) {
            console.log('spaCy server is available');
            serverCheckFailed = false;
            serverLastChecked = now;
            return true;
        } else {
            console.warn(`spaCy server returned status ${response.status}`);
            serverCheckFailed = true;
            serverLastChecked = now;
            return false;
        }
    } catch (error) {
        console.warn('spaCy server check failed:', error.message);
        serverCheckFailed = true;
        serverLastChecked = now;
        return false;
    }
};

/**
 * Process text with the spaCy server
 */
export const processWithSpacyServer = async (text: string): Promise<{
    entities: { text: string; label: string; start: number; end: number }[];
    sentences: string[];
}> => {
    try {
        const response = await axios.post(SPACY_SERVER_URL, { text }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });

        return response.data;
    } catch (error) {
        console.error('Error processing with spaCy server:', error.message);
        throw error;
    }
};

/**
 * Primary method to analyze text and extract entities
 */
export const analyzeText = async (text: string): Promise<RecognizedEntity[]> => {
    // Skip text that's too short
    if (!text || text.length < 20) {
        return [];
    }

    try {
        // Check if the Python spaCy server is available
        const serverAvailable = await isSpacyServerAvailable();

        if (serverAvailable) {
            try {
                // Process the text using the Python spaCy server
                const result = await processWithSpacyServer(text);

                // Map the server response to our entity format
                const entitiesMap: Record<string, RecognizedEntity> = {};

                // Process entities
                for (const entity of result.entities) {
                    const key = `${entity.text.toLowerCase()}_${entity.label}`;

                    if (!entitiesMap[key]) {
                        entitiesMap[key] = {
                            text: entity.text,
                            label: entity.label,
                            sentences: []
                        };
                    }

                    // Find sentences containing this entity
                    const matchingSentences = result.sentences.filter(
                        s => s.toLowerCase().includes(entity.text.toLowerCase())
                    );

                    // Add unique sentences
                    for (const sentence of matchingSentences) {
                        if (!entitiesMap[key].sentences.includes(sentence)) {
                            entitiesMap[key].sentences.push(sentence);
                        }
                    }
                }

                const entities = Object.values(entitiesMap);
                console.log(`Extracted ${entities.length} entities using Python spaCy server`);
                return entities;
            } catch (parseError) {
                console.warn('Error processing with spaCy server:', parseError);
                // Fall back to the simple extractor
                console.log('Falling back to simple entity extraction');
                return simpleEntityExtractor.extractEntities(text);
            }
        } else {
            // If the server is not available, use the simple extractor
            console.log('spaCy server not available, using fallback entity extraction');
            return simpleEntityExtractor.extractEntities(text);
        }
    } catch (error) {
        console.error('Error in entity extraction:', error);
        // Use fallback in case of any errors
        return simpleEntityExtractor.extractEntities(text);
    }
};

/**
 * Generate fake entities for testing
 */
export const generateTestEntities = (text: string): RecognizedEntity[] => {
    return simpleEntityExtractor.generateFakeEntities(text);
};