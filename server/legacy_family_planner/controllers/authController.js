const login = (req, res) => {
    res.send("Login endpoint");
};

const logout = (req, res) => {
    res.send("Logout endpoint");
};

module.exports = { login, logout };
