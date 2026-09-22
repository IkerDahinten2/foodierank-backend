// Controlador async para que cualquier error que ocurra en un controller async se propague al errorHandler
function catchAsync(fn) {
  return function wrappedController(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = catchAsync;
