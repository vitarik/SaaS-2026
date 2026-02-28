const express = require('express');
const pool = require('../config/db');
const { getOverviewTotals, calculateMonthlyIncome, getBudgetForMonth, formatDate, getIncomesForMonth, getExpensesForMonth} = require('./overviewRoutes'); // ✅ Importing from overviewRoutes.js

const router = express.Router();

const ensureAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// **Route to Get Budget for Selected Month**
router.get('/', ensureAuthenticated, async (req, res) => {
    const userEmail = req.session.user.email;
    const { month, year, category } = req.query;

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const selectedCategory = category || 'all';

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        if (userResult.rows.length === 0) return res.redirect('/login');

        const userId = userResult.rows[0].id;

        // ✅ Fetch budgets from overviewRoutes.js
        const budgetEntries = await getBudgetForMonth(userId, currentMonth, currentYear);

        // ✅ Fetch Overview Totals (From overviewRoutes.js)
        const { 
            totalEstimatedIncome,  
            totalCurrentIncome, 
            totalEstimatedOut, 
            totalCurrentExpenses 
        } = await getOverviewTotals(userId, currentMonth, currentYear);

        // ✅ Calculate Budget Totals
        const totalPredicted = budgetEntries.reduce((acc, item) => acc + parseFloat(item.predicted_amount || 0), 0);
        const totalReal = budgetEntries.reduce((acc, item) => acc + parseFloat(item.real_amount || 0), 0);
        const totalBalance = totalPredicted - totalReal;

        console.log(`📊 Budget Totals: Predicted=${totalPredicted}, Real=${totalReal}, Balance=${totalBalance}`);

        res.render('index', {
            budgets: budgetEntries,
            currentMonth,
            currentYear,
            monthlyIncomeEstimate: totalEstimatedIncome, // ✅ Fix: Pass totalEstimatedIncome as monthlyIncomeEstimate
            currentIncome: totalCurrentIncome, // ✅ Ensure current income is passed
            totalEstimatedOut,   
            totalCurrentExpenses,  
            totalPredicted,
            totalReal,
            totalBalance,
            selectedCategory
        });              
    } catch (err) {
        console.error("❌ Error fetching budget:", err);
        res.status(500).send('Server error');
    }
});


// **Add New Budget Entry**
router.post('/add-budget', ensureAuthenticated, async (req, res) => {
    const userEmail = req.session.user.email;
    const { category, predicted_amount, description, date, recurring, frequency, start_date, end_date } = req.body;

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        if (userResult.rows.length === 0) return res.redirect('/login');

        const userId = userResult.rows[0].id;

        await pool.query(
            `INSERT INTO budgets (user_id, category, predicted_amount, real_amount, description, date, recurring, frequency, start_date, end_date)
             VALUES ($1, $2, $3, 0, $4, $5, $6, $7, CAST(NULLIF($8, '') AS DATE), CAST(NULLIF($9, '') AS DATE))`,
            [userId, category, predicted_amount, description, date, recurring === 'true', frequency, start_date, end_date]
        );

        res.redirect('/');
    } catch (err) {
        console.error("❌ Error adding budget:", err);
        res.status(500).send('Server error');
    }
});

// **Update a Budget Entry**
router.post('/update-budget/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { category, predicted_amount, description, date, frequency, start_date, end_date } = req.body;

    const recurring = Array.isArray(req.body.recurring) ? req.body.recurring.pop() === "true" : req.body.recurring === "true";

    try {
        await pool.query(
            `UPDATE budgets 
             SET category = $1, predicted_amount = $2, description = $3, date = $4, 
                 recurring = $5, frequency = $6, 
                 start_date = CAST(NULLIF($7, '') AS DATE), 
                 end_date = CAST(NULLIF($8, '') AS DATE)
             WHERE id = $9`,
            [category, predicted_amount, description, date, recurring, frequency, start_date, end_date, id]
        );
        res.redirect('/');
    } catch (err) {
        console.error("❌ Error updating budget:", err);
        res.status(500).send('Server error');
    }
});

// **Delete a Budget Entry**
router.post('/delete-budget/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM budgets WHERE id = $1', [id]);
        res.redirect('/');
    } catch (err) {
        console.error("❌ Error deleting budget:", err);
        res.status(500).send('Server error');
    }
});

module.exports = router;