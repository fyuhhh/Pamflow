const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    console.log('[DEBUG] 401: Token not found in headers for', req.method, req.originalUrl, req.headers);
    return res.status(401).json({ message: 'Akses ditolak: Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak: Format token salah' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'pamflow_secret_fallback_key');
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Sesi berakhir atau token tidak valid' });
  }
};

module.exports = verifyToken;
