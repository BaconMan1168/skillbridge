const { Router } = require('express')
const sessionController = require('../controllers/sessionController')

const sessionRouter = Router();


// /sessions route
sessionRouter.post('/ready', sessionController.markReady)
sessionRouter.post('/end', sessionController.endSession)
sessionRouter.post('/rate', sessionController.rateSession)