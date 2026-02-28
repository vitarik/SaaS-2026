const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// PostgreSQL setup
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});

// Configure Passport to use Google strategy for authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/secrets"
  },
  async (token, tokenSecret, profile, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [profile.emails[0].value]);

      if (result.rows.length === 0) {
        // If the user does not exist, create a new user
        await pool.query('INSERT INTO users (email, google_id) VALUES ($1, $2)', [profile.emails[0].value, profile.id]);
      }

      const user = {
        email: profile.emails[0].value,
        id: profile.id
      };

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Serialize user to store in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [id, id]);
    const user = result.rows[0];
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
