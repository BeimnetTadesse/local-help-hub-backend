const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  console.log('POST /api/test received:', req.body);
  res.json({ message: 'Test successful ✅' });
});

module.exports = router;
