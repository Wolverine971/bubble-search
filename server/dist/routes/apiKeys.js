"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../index");
const router = express_1.default.Router();
// Get user's API keys
router.get('/', async (req, res) => {
    const userId = req.headers.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const { data, error } = await index_1.supabase
            .from('api_keys')
            .select('*')
            .eq('user_id', userId);
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (error) {
        console.error('Get API keys error:', error);
        res.status(400).json({ error: error.message });
    }
});
// Save API keys
router.post('/', async (req, res) => {
    const userId = req.headers.userId;
    const { service_name, api_key } = req.body;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        // Check if key already exists
        const { data: existingKey } = await index_1.supabase
            .from('api_keys')
            .select('*')
            .eq('user_id', userId)
            .eq('service_name', service_name)
            .single();
        if (existingKey) {
            // Update existing key
            const { error } = await index_1.supabase
                .from('api_keys')
                .update({ api_key })
                .eq('id', existingKey.id);
            if (error)
                throw error;
        }
        else {
            // Create new key
            const { error } = await index_1.supabase
                .from('api_keys')
                .insert([
                { user_id: userId, service_name, api_key }
            ]);
            if (error)
                throw error;
        }
        res.status(200).json({ message: 'API key saved successfully' });
    }
    catch (error) {
        console.error('Save API key error:', error);
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
