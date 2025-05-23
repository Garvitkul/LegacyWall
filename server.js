const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Get all notes
app.get('/api/notes', async (req, res) => {
    try {
        const data = await fs.readFile('notes.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.json([]);
    }
});

// Save notes
app.post('/api/notes', async (req, res) => {
    try {
        await fs.writeFile('notes.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save notes' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 