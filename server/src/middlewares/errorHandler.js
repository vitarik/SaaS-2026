const { fail } = require("../shared/response");
const { AppError } = require("../shared/errors");

function errorHandler(err, req, res, next) {
  // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    return fail(res, err.status, err.code, err.message, err.details);
  }
  console.error(err);
  return fail(res, 500, "INTERNAL_ERROR", "Something went wrong.");
}

module.exports = { errorHandler };
