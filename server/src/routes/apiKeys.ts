import express from 'express';
import { supabase } from '../index';

const router = express.Router();

// Get user's API keys
router.get('/', async (req, res) => {
    const userId = req.headers.userId as string;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error('Get API keys error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Save API keys
router.post('/', async (req, res) => {
    const userId = req.headers.userId as string;
    const { service_name, api_key } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Check if key already exists
        const { data: existingKey } = await supabase
            .from('api_keys')
            .select('*')
            .eq('user_id', userId)
            .eq('service_name', service_name)
            .single();

        if (existingKey) {
            // Update existing key
            const { error } = await supabase
                .from('api_keys')
                .update({ api_key })
                .eq('id', existingKey.id);

            if (error) throw error;
        } else {
            // Create new key
            const { error } = await supabase
                .from('api_keys')
                .insert([
                    { user_id: userId, service_name, api_key }
                ]);

            if (error) throw error;
        }

        res.status(200).json({ message: 'API key saved successfully' });
    } catch (error) {
        console.error('Save API key error:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;