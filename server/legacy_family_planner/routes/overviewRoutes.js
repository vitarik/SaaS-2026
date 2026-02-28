const pool = require('../config/db');


// Function to format dates for EJS templates
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// **Function to Fetch Budgets for a Given Month (Reusable Across Budget, Incomes & Expenses)**
const getBudgetForMonth = async (userId, month, year) => {
    const todayFormatted = new Date().toISOString().split('T')[0];

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-${lastDayOfMonth}`;

    console.log(`Fetching budgets for UserID: ${userId}, Month: ${month}, Year: ${year}`);

    const query = `
        SELECT b.*, 
               COALESCE(SUM(
                   CASE 
                       WHEN EXTRACT(MONTH FROM e.date) = $2 
                       AND EXTRACT(YEAR FROM e.date) = $3 
                       AND e.date <= $4 
                       THEN e.amount 
                       ELSE 0 
                   END
               ), 0) AS real_amount,
               (b.predicted_amount - COALESCE(SUM(
                   CASE 
                       WHEN EXTRACT(MONTH FROM e.date) = $2 
                       AND EXTRACT(YEAR FROM e.date) = $3 
                       AND e.date <= $4 
                       THEN e.amount 
                       ELSE 0 
                   END
               ), 0)) AS balance
        FROM budgets b
        LEFT JOIN expense e ON b.id = e.entry_id 
        WHERE b.user_id = $1 
        AND (
            (EXTRACT(MONTH FROM b.date) = $2 AND EXTRACT(YEAR FROM b.date) = $3)
            OR 
            (b.recurring = TRUE 
             AND b.start_date <= $6 
             AND (b.end_date IS NULL OR b.end_date >= $5))
        )
        GROUP BY b.id
    `;

    const values = [userId, month, year, todayFormatted, startDate, endDate];

    try {
        const result = await pool.query(query, values);
        console.log("📊 Retrieved Budget Entries:", result.rows);
        return result.rows;
    } catch (err) {
        console.error("❌ Error fetching budgets:", err);
        return [];
    }
};

// **Function to Fetch Expenses for a Given Month and Year (Includes Recurring Expenses)**
const getExpensesForMonth = async (userId, month, year) => {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    console.log(`Fetching expenses for UserID: ${userId}, Month: ${month}, Year: ${year}`);

    const query = `
        SELECT e.*, 
               COALESCE(SUM(
                   CASE 
                       WHEN EXTRACT(MONTH FROM e.date) = $2 
                       AND EXTRACT(YEAR FROM e.date) = $3 
                       AND e.date <= $4 
                       THEN e.amount 
                       ELSE 0 
                   END
               ), 0) AS current_expenses,
               COALESCE(SUM(e.amount), 0) AS estimated_expenses
        FROM expense e
        WHERE e.user_id = $1 
        AND (
            (EXTRACT(MONTH FROM e.date) = $2 AND EXTRACT(YEAR FROM e.date) = $3)
            OR (e.recurring = TRUE) -- ✅ Include recurring expenses
        )
        GROUP BY e.id
    `;

    try {
        const result = await pool.query(query, [userId, month, year, todayFormatted]);
        console.log("📊 Retrieved Expenses:", result.rows);
        return result.rows;
    } catch (err) {
        console.error("❌ Error fetching expenses:", err);
        return [];
    }
};

// **Function to Fetch Incomes for a Given Month and Year (Includes Recurring Incomes)**
const getIncomesForMonth = async (userId, month, year) => {
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    console.log(`Fetching incomes for UserID: ${userId}, Month: ${month}, Year: ${year}`);

    const query = `
        SELECT i.*, 
               COALESCE(SUM(
                   CASE 
                       WHEN EXTRACT(MONTH FROM i.date) = $2 
                       AND EXTRACT(YEAR FROM i.date) = $3 
                       AND i.date <= $4 
                       THEN i.amount 
                       ELSE 0 
                   END
               ), 0) AS current_income,
               COALESCE(SUM(i.amount), 0) AS estimated_income
        FROM income i
        WHERE i.user_id = $1 
        AND (
            (EXTRACT(MONTH FROM i.date) = $2 AND EXTRACT(YEAR FROM i.date) = $3)
            OR (i.frequency IS NOT NULL) -- ✅ Include recurring incomes
        )
        GROUP BY i.id
    `;

    try {
        const result = await pool.query(query, [userId, month, year, todayFormatted]);
        console.log("📊 Retrieved Incomes:", result.rows);
        return result.rows;
    } catch (err) {
        console.error("❌ Error fetching incomes:", err);
        return [];
    }
};

// **Function to Calculate Monthly Income Based on Frequency**
const calculateMonthlyIncome = (incomeEntries, targetMonth, targetYear) => {
    let totalEstimatedIncome = 0;
    let totalCurrentIncome = 0;
    const currentDate = new Date();
    const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();

    incomeEntries.forEach(entry => {
        const incomeDate = new Date(entry.date);
        const entryAmount = parseFloat(entry.amount);
        const startMonth = incomeDate.getMonth() + 1;
        const startYear = incomeDate.getFullYear();
        const startDay = incomeDate.getDate();

        let payDays = [];

        if (entry.frequency === 'one-time') {
            // ✅ One-time payment only in the specific month
            if (startMonth === targetMonth && startYear === targetYear) {
                totalEstimatedIncome += entryAmount;
                if (incomeDate <= currentDate) {
                    totalCurrentIncome += entryAmount;
                }
            }
        } else if (entry.frequency === 'weekly') {
            // ✅ Weekly payments
            let payDay = startDay;
            while (payDay <= daysInTargetMonth) {
                payDays.push(payDay);
                payDay += 7;
            }
        } else if (entry.frequency === 'bi-weekly') {
            // ✅ Bi-weekly payments (every 14 days)
            let firstPayDay = new Date(startYear, startMonth - 1, startDay);
            while (firstPayDay.getMonth() + 1 < targetMonth || firstPayDay.getFullYear() < targetYear) {
                firstPayDay.setDate(firstPayDay.getDate() + 14);
            }

            while (firstPayDay.getMonth() + 1 === targetMonth && firstPayDay.getDate() <= daysInTargetMonth) {
                payDays.push(firstPayDay.getDate());
                firstPayDay.setDate(firstPayDay.getDate() + 14);
            }
        } else if (entry.frequency === 'monthly') {
            // ✅ Monthly payments (same day each month)
            if (startDay <= daysInTargetMonth) {
                payDays.push(startDay);
            }
        }

        // ✅ Add income for the selected month
        payDays.forEach(payDay => {
            totalEstimatedIncome += entryAmount;
            if (new Date(targetYear, targetMonth - 1, payDay) <= currentDate) {
                totalCurrentIncome += entryAmount;
            }
        });
    });

    console.log(`📌 Monthly Income Calculation for ${targetMonth}/${targetYear}: Estimated=${totalEstimatedIncome}, Current=${totalCurrentIncome}`);

    return {
        estimated: totalEstimatedIncome,
        current: totalCurrentIncome
    };
};

// **Function to Fetch Overview Totals**
const getOverviewTotals = async (userId, month, year) => {
    try {
        const todayFormatted = new Date().toISOString().split('T')[0];

        console.log(`Fetching overview totals for UserID: ${userId}, Month: ${month}, Year: ${year}`);

        const expenseResult = await pool.query(
            `SELECT SUM(amount) AS total_current_expenses 
             FROM expense 
             WHERE user_id = $1 
             AND EXTRACT(MONTH FROM date) = $2 
             AND EXTRACT(YEAR FROM date) = $3 
             AND date <= $4`,
            [userId, month, year, todayFormatted]
        );

        const estimatedExpenseResult = await pool.query(
            `SELECT SUM(predicted_amount) AS total_estimated_out 
             FROM budgets 
             WHERE user_id = $1 
             AND (
                (EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3)
                OR (recurring = TRUE AND start_date <= $4)
             )`,
            [userId, month, year, todayFormatted]
        );

        const incomeResult = await pool.query(
            `SELECT * FROM income 
             WHERE user_id = $1 
             AND (
                (EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3)
                OR (frequency IS NOT NULL)
             )`,
            [userId, month, year]
        );

        const incomeEntries = incomeResult.rows.length > 0 ? incomeResult.rows : [];

        // ✅ Calculate estimated & current monthly income
        const { estimated: totalEstimatedIncome, current: totalCurrentIncome } = 
            calculateMonthlyIncome(incomeEntries, month, year);

        const totalEstimatedOut = estimatedExpenseResult.rows[0]?.total_estimated_out || 0;
        const totalCurrentExpenses = expenseResult.rows[0]?.total_current_expenses || 0;

        console.log(`✅ Overview Totals -> Estimated IN: ${totalEstimatedIncome}, Current IN: ${totalCurrentIncome}, Estimated OUT: ${totalEstimatedOut}, Current OUT: ${totalCurrentExpenses}`);

        return {
            totalEstimatedIncome,
            totalCurrentIncome,
            totalEstimatedOut,
            totalCurrentExpenses
        };
    } catch (err) {
        console.error("❌ Error fetching overview totals:", err);
        return {
            totalEstimatedIncome: 0,
            totalCurrentIncome: 0,
            totalEstimatedOut: 0,
            totalCurrentExpenses: 0
        };
    }
};


// ✅ Export the functions to be used in other route files
module.exports = { getOverviewTotals, calculateMonthlyIncome, getBudgetForMonth, formatDate, getIncomesForMonth, getExpensesForMonth};

