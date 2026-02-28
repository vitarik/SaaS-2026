const getIncomes = (req, res) => {
    res.send("Retrieve Incomes");
};

const addIncome = (req, res) => {
    res.send("Add Income");
};

module.exports = { getIncomes, addIncome };
