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

// **Route to Get Expenses for a Selected Month**
router.get('/', ensureAuthenticated, async (req, res) => {
    const userEmail = req.session.user.email;
    const { month, year, category } = req.query;

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const selectedCategory = category || 'all'; // ✅ Keep same logic as Incomes

    console.log(`🔍 Fetching expenses for User: ${userEmail}, Month: ${currentMonth}, Year: ${currentYear}, Category: ${selectedCategory}`);

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        if (userResult.rows.length === 0) return res.redirect('/login');

        const userId = userResult.rows[0].id;

        // ✅ Fetch expenses, budgets, and incomes
        const expenseEntries = await getExpensesForMonth(userId, currentMonth, currentYear);
        const budgetEntries = await getBudgetForMonth(userId, currentMonth, currentYear);
        const incomeEntries = await getIncomesForMonth(userId, currentMonth, currentYear);

        // ✅ Calculate Monthly Income
        const { estimated: monthlyIncomeEstimate, current: currentIncome } = calculateMonthlyIncome(incomeEntries, currentMonth, currentYear);

        // ✅ Calculate Budget Totals (`OUT`)
        const totalExpenses = expenseEntries.reduce((acc, item) => acc + parseFloat(item.current_expenses || 0), 0);
        const totalPredicted = budgetEntries.reduce((acc, item) => acc + parseFloat(item.predicted_amount || 0), 0);
        const totalReal = budgetEntries.reduce((acc, item) => acc + parseFloat(item.real_amount || 0), 0);
        const totalBalance = totalPredicted - totalReal;

        console.log(`📊 Budget Totals: Predicted=${totalPredicted}, Real=${totalReal}, Expenses=${totalExpenses}`);

        res.render('expenses', {
            expenses: expenseEntries,
            currentMonth,
            currentYear,
            monthlyIncomeEstimate,  // ✅ Now passed to expenses.ejs
            currentIncome,          // ✅ Now passed to expenses.ejs
            totalPredicted,
            totalReal,
            totalExpenses,  
            totalBalance,
            selectedCategory,
            formatDate
        });
    } catch (err) {
        console.error("❌ Error fetching expenses:", err);
        res.status(500).send('Server error');
    }
});


// **Route to Add New Expense**
router.post('/add-expense', ensureAuthenticated, async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { amount, category, entry_id, date } = req.body;
    const userEmail = req.session.user.email;

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        const userId = userResult.rows[0].id;

        // Insert expense
        await pool.query(
            `INSERT INTO expense (user_id, amount, category, entry_id, date) 
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, amount, category, entry_id, date]
        );

        // ✅ Update real amount in the budget
        await pool.query(
            `UPDATE budgets SET real_amount = real_amount + $1 
             WHERE id = $2 AND user_id = $3`,
            [amount, entry_id, userId]
        );

        res.redirect('/expenses');
    } catch (err) {
        console.error("❌ Error adding expense:", err);
        res.status(500).send('Server error');
    }
});

// **Route to Update Expense**
router.post('/update-expense/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { amount, category, entry_id, date } = req.body;

    try {
        console.log(`🔄 Updating expense ID: ${id}, New Amount: ${amount}, Category: ${category}, Entry ID: ${entry_id}, Date: ${date}`);

        // Get the original expense details
        const expenseResult = await pool.query('SELECT amount, entry_id FROM expense WHERE id = $1', [id]);
        if (expenseResult.rows.length === 0) {
            console.error("❌ Expense not found!");
            return res.status(404).send("Expense not found");
        }

        const originalExpense = expenseResult.rows[0];
        const originalAmount = parseFloat(originalExpense.amount);
        const originalEntryId = originalExpense.entry_id;

        // Update the expense
        await pool.query(
            `UPDATE expense 
             SET amount = $1, category = $2, entry_id = $3, date = $4 
             WHERE id = $5`,
            [amount, category, entry_id, date, id]
        );

        // Adjust the budget for the original entry
        await pool.query(
            'UPDATE budgets SET real_amount = real_amount - $1 WHERE id = $2',
            [originalAmount, originalEntryId]
        );

        // Adjust the budget for the new entry
        await pool.query(
            'UPDATE budgets SET real_amount = real_amount + $1 WHERE id = $2',
            [amount, entry_id]
        );

        console.log("✅ Expense updated successfully!");

        res.redirect('/expenses');
    } catch (err) {
        console.error("❌ Error updating expense:", err);
        res.status(500).send('Server error');
    }
});

// Route to get entries for a category
router.get('/get-entries/:category', ensureAuthenticated, async (req, res) => {
    const { category } = req.params;
    const userEmail = req.session.user.email;

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userId = userResult.rows[0].id;
        console.log(`Fetching budget entries for UserID: ${userId}, Category: ${category}`);

        // Fetch budget entries for the selected category
        const result = await pool.query(
            `SELECT id, description, predicted_amount, real_amount 
             FROM budgets 
             WHERE user_id = $1 AND category = $2`,
            [userId, category]
        );

        console.log("📊 Retrieved Budget Entries:", result.rows);
        res.json(result.rows); // ✅ Send results as JSON
    } catch (err) {
        console.error("❌ Error fetching budget entries:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// **Route to Delete Expense**
router.post('/delete-expense/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        const userEmail = req.session.user.email;
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        if (userResult.rows.length === 0) return res.redirect('/login');

        const userId = userResult.rows[0].id;

        // Fetch the expense entry to adjust the budget
        const expenseResult = await pool.query('SELECT amount, entry_id FROM expense WHERE id = $1', [id]);
        const expense = expenseResult.rows[0];
        const expenseAmount = parseFloat(expense.amount);
        const budgetEntryId = expense.entry_id;

        console.log(`Deleting expense ID: ${id}, Amount: ${expenseAmount}, Budget Entry: ${budgetEntryId}`);

        // Delete the expense
        await pool.query('DELETE FROM expense WHERE id = $1', [id]);

        // ✅ Deduct the amount from the associated budget entry
        await pool.query(
            'UPDATE budgets SET real_amount = real_amount - $1 WHERE id = $2 AND user_id = $3',
            [expenseAmount, budgetEntryId, userId]
        );

        console.log(`✅ Updated Budget Entry ${budgetEntryId}: Removed Expense ${expenseAmount}`);

        res.redirect('/expenses');
    } catch (err) {
        console.error("❌ Error deleting expense:", err);
        res.status(500).send('Server error');
    }
});



module.exports = router;
