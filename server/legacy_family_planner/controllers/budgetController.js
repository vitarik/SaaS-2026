const getBudget = (req, res) => {
    res.send("Retrieve Budget Data");
};

const createBudget = (req, res) => {
    res.send("Create Budget");
};

module.exports = { getBudget, createBudget };
