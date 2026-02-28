const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const env = require("./config/env");
const app = require("./app");

app.listen(env.port, () => {
  console.log(`✅ API listening on port ${env.port}`);
});
