const express = require("express");
const router = express.Router();
// let os = require('os-utils');
router.use("/users", require("./users"));
router.use("/auth", require("./auth"));
router.use("/admins", require("./admins"));
router.use("/file", require("./file"));
router.use("/session", require("./session"));
router.use("/notary", require("./notary"));
router.use("/signatures", require("./signatures"));

router.get("/", function(req, res) {
  res.status(200).json("I am running");
});

router.use("*", function(req, res) {
  res.status(404).json({
    errors: {
      msg: "URL_NOT_FOUND",
    },
  });
});
module.exports = router;
