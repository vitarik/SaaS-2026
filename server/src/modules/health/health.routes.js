const router = require("express").Router();
const { ok } = require("../../shared/response");

router.get("/", (req, res) => ok(res, { status: "ok" }));

module.exports = router;
