const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
const notesFile = path.join(dataDir, 'notes.json');

async function ensureDataDir() {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        try {
            await fs.access(notesFile);
        } catch {
            await fs.writeFile(notesFile, '[]');
        }
    } catch (error) {
        console.error('Error setting up data directory:', error);
    }
}

// Get all notes
app.get('/api/notes', async (req, res) => {
    try {
        const data = await fs.readFile(notesFile, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading notes:', error);
        res.json([]);
    }
});

// Save notes
app.post('/api/notes', async (req, res) => {
    try {
        await fs.writeFile(notesFile, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving notes:', error);
        res.status(500).json({ error: 'Failed to save notes' });
    }
});

// Initialize data directory before starting server
ensureDataDir().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}); 
