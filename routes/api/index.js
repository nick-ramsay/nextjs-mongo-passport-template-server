const router = require("express").Router();
const nmptRoutes = require("./nmptRoutes");

// next-js-mongo-passport-template routes
router.use("/next-js-mongo-passport-template", nmptRoutes);

module.exports = router;