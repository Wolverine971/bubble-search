import cors from 'cors';
import { config } from 'dotenv';
// src/index.ts
import express from 'express';

import enhancedSearchRoutes from './routes/enhancedSearchRoutes';
import searchRoutes from './routes/search';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Bubble Search API is running');
});

app.use('/api/search', searchRoutes);
app.use('/api/enhanced-search', enhancedSearchRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`- Regular Search API: http://localhost:${PORT}/api/search`);
    console.log(`- Enhanced Search API: http://localhost:${PORT}/api/enhanced-search`);
});