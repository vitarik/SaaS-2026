const { ok } = require("../../shared/response");
const { AppError } = require("../../shared/errors");
const usersService = require("./users.service");

async function getMe(req, res, next) {
  try {
    const user = await usersService.getUserById(req.user.id);
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found.");
    return ok(res, user);
  } catch (e) {
    return next(e);
  }
}

async function patchMe(req, res, next) {
  try {
    const { first_name, last_name } = req.body || {};
    const user = await usersService.updateMe(req.user.id, { first_name, last_name });
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found.");
    return ok(res, user);
  } catch (e) {
    return next(e);
  }
}

module.exports = { getMe, patchMe };
