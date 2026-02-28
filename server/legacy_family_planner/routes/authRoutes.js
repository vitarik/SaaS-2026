const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const router = express.Router();

// **User Registration Route (POST)**
router.post('/register', async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    try {
        console.log("📩 Registration Attempt:", email); // ✅ Debugging Line

        // ✅ Ensure all fields are filled
        if (!email || !password || !confirmPassword) {
            return res.render('register', { error: 'All fields are required' });
        }

        // ✅ Check if passwords match
        if (password !== confirmPassword) {
            return res.render('register', { error: 'Passwords do not match' });
        }

        // ✅ Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.render('register', { error: 'Email already registered' });
        }

        // ✅ Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert new user into database
        const newUser = await pool.query(
            `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email`, 
            [email, hashedPassword]
        );

        console.log(`✅ User registered: ${email}`);

        // ✅ Auto-login after registration
        req.session.user = { id: newUser.rows[0].id, email: newUser.rows[0].email };
        res.redirect('/');
    } catch (err) {
        console.error('❌ Error registering user:', err);
        res.render('register', { error: 'An error occurred. Please try again.' });
    }
});

// **GET Register Page (Ensure `error` is Always Defined)**
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// **Regular Login Route (POST)**
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).render('login', { error: 'Invalid email or password' });
        }

        const user = userResult.rows[0];

        // ✅ Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).render('login', { error: 'Invalid email or password' });
        }

        // ✅ Set session and redirect
        req.session.user = { id: user.id, email: user.email};
        res.redirect('/');
    } catch (err) {
        console.error('❌ Error logging in:', err);
        res.status(500).send('Server error');
    }
});

// **Google OAuth Login**
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/secrets', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    req.session.user = req.user;
    res.redirect('/');
});

// **Logout Route**
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
