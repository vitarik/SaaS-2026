const getExpenses = (req, res) => {
    res.send("Retrieve Expenses");
};

const addExpense = (req, res) => {
    res.send("Add Expense");
};

module.exports = { getExpenses, addExpense };
