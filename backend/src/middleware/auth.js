const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'alinotes_secret_key_institut_ali_2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide ou expiré' });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken, JWT_SECRET };
