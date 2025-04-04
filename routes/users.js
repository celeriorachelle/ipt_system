const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Users route is working!');
});

module.exports = router;  // ✅ Make sure you are exporting correctly
