const db = require('../../db');
const bcrypt = require('bcrypt');

const getPendingRequests = async (req, res) => {
  try {
    const pool = await db();
    const [rows] = await pool.query(`
      SELECT p.id, p.orgId, p.email as identifier, p.status, p.created_at, 
             u.id as user_id, u.firstName, u.lastName, u.department, u.username
      FROM atur_ulang_pw p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.status = 'pending' 
      ORDER BY p.created_at DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching password reset requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const resolveRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await db();
    
    // Check if request exists
    const [requests] = await pool.query('SELECT * FROM atur_ulang_pw WHERE id = ?', [id]);
    if (requests.length === 0) {
      return res.status(404).json({ message: 'Permintaan tidak ditemukan' });
    }
    
    const request = requests[0];
    const userId = request.user_id;

    // Default PIN for agen is '123456'
    const defaultPin = '123456';
    const hashedPin = await bcrypt.hash(defaultPin, 10);

    // Update user's PIN
    await pool.query('UPDATE users SET pin = ? WHERE id = ?', [hashedPin, userId]);

    // Mark request as resolved
    await pool.query('UPDATE atur_ulang_pw SET status = ? WHERE id = ?', ['resolved', id]);

    res.json({ message: 'PIN berhasil direset ke 123456 dan permintaan ditandai selesai.' });
  } catch (error) {
    console.error('Error resolving password reset request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPendingRequests,
  resolveRequest
};
