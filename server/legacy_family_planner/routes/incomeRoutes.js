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

// **Route to Get Incomes for a Selected Month**
router.get('/', ensureAuthenticated, async (req, res) => {
    const userEmail = req.session.user.email;
    const { month, year, category } = req.query;

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const selectedCategory = category || 'all'; // ✅ RESTORED `selectedCategory`

    console.log(`🔍 Fetching incomes for User: ${userEmail}, Month: ${currentMonth}, Year: ${currentYear}, Category: ${selectedCategory}`);

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        if (userResult.rows.length === 0) return res.redirect('/login');

        const userId = userResult.rows[0].id;

        // ✅ Fetch incomes and budgets
        const incomeEntries = await getIncomesForMonth(userId, currentMonth, currentYear);
        const budgetEntries = await getBudgetForMonth(userId, currentMonth, currentYear);

        // ✅ Calculate Monthly Income
        const { estimated: monthlyIncomeEstimate, current: currentIncome } = calculateMonthlyIncome(incomeEntries, currentMonth, currentYear);

        // ✅ Calculate Budget Totals (`OUT`)
        const totalExpenses = budgetEntries.reduce((acc, item) => acc + parseFloat(item.real_amount || 0), 0);
        const totalPredicted = budgetEntries.reduce((acc, item) => acc + parseFloat(item.predicted_amount || 0), 0);
        const totalReal = budgetEntries.reduce((acc, item) => acc + parseFloat(item.real_amount || 0), 0);
        const totalBalance = totalPredicted - totalReal;

        console.log(`📊 Budget Totals: Predicted=${totalPredicted}, Real=${totalReal}, Expenses=${totalExpenses}`);

        res.render('incomes', {
            incomes: incomeEntries,
            currentMonth,
            currentYear,
            monthlyIncomeEstimate,  // ✅ Fixed to match Budget view
            currentIncome,          // ✅ Fixed to match Budget view
            totalPredicted,
            totalReal,
            totalExpenses,
            totalBalance,
            selectedCategory,
            formatDate
        });
    } catch (err) {
        console.error("❌ Error fetching incomes:", err);
        res.status(500).send('Server error');
    }
});


// **Route to Add New Income**
router.post('/add-income', ensureAuthenticated, async (req, res) => {
    const userEmail = req.session.user.email;
    const { amount, source, category, date, frequency } = req.body;

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        if (userResult.rows.length === 0) return res.redirect('/login');

        const userId = userResult.rows[0].id;
        console.log(`Adding income for UserID: ${userId}, Source: ${source}, Amount: ${amount}, Frequency: ${frequency}`);

        await pool.query(
            `INSERT INTO income (user_id, amount, source, category, date, frequency)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, amount, source, category, date, frequency]
        );

        res.redirect('/incomes');  // ✅ Redirect back to incomes page after adding
    } catch (err) {
        console.error("❌ Error adding income:", err);
        res.status(500).send('Server error');
    }
});

// **Route to Update Income**
router.post('/update-income/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { amount, source, category, date, frequency } = req.body;

    try {
        console.log(`Updating income ID: ${id}, New Source: ${source}, Amount: ${amount}`);

        await pool.query(
            `UPDATE income 
             SET amount = $1, source = $2, category = $3, date = $4, frequency = $5
             WHERE id = $6`,
            [amount, source, category, date, frequency, id]
        );

        res.redirect('/incomes');
    } catch (err) {
        console.error("❌ Error updating income:", err);
        res.status(500).send('Server error');
    }
});

// **Route to Delete Income**
router.post('/delete-income/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        console.log(`Deleting income ID: ${id}`);

        await pool.query('DELETE FROM income WHERE id = $1', [id]);
        res.redirect('/incomes');
    } catch (err) {
        console.error("❌ Error deleting income:", err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
