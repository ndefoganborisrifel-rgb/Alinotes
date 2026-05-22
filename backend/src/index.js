require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/annees', require('./routes/annees'));
app.use('/api/filieres', require('./routes/filieres'));
app.use('/api/niveaux', require('./routes/niveaux'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/etudiants', require('./routes/etudiants'));
app.use('/api/enseignants', require('./routes/enseignants'));
app.use('/api/matieres', require('./routes/matieres'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/bulletins', require('./routes/bulletins'));
app.use('/api/pv', require('./routes/pv'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Alinotes API running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Alinotes API server running on http://localhost:${PORT}`);
});

module.exports = app;
