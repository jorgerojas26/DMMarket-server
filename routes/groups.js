const router = require("express").Router();

const controller = require("../controllers/groups");

router.route("/").get(controller.GET_GROUPS);

module.exports = router;
