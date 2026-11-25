const { MyShifts, MySessions, UpdateMySession } = require("../controllers/trainer.controller");

const trainerRouter = require("express").Router();


trainerRouter.get("/shifts", MyShifts);
trainerRouter.get("/sessions/today", MySessions);
trainerRouter.patch("/sessions/:id", UpdateMySession);

module.exports = trainerRouter;