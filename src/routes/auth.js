const { Router } = require('express');
const { register, login } = require('../controllers/authController');
const authenticateToken = require('../middlewares/auth');

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/protegida', authenticateToken, (req, res) => {
    res.send('esta es una ruta protegida.');
});

module.exports = router;
