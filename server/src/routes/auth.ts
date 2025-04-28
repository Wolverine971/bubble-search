import express from 'express';
import { supabase } from '../index';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // Register with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        // Create user profile in database
        if (data.user) {
            const { error: profileError } = await supabase
                .from('users')
                .insert([
                    { id: data.user.id, email, name, created_at: new Date() }
                ]);

            if (profileError) throw profileError;
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Get user profile
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (userError) throw userError;

        res.status(200).json({
            user: userData,
            session: data.session
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;