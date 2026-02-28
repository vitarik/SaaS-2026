const calculateTotalBudget = (budgetData) => {
    return budgetData.reduce((total, item) => total + item.amount, 0);
};

module.exports = { calculateTotalBudget };
