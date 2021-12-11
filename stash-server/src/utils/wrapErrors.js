// Wrap a middleware function in another function that handles errors
module.exports = function(middleware) {
  return async function(req, res, next) {
    try {
      return await middleware(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
};
