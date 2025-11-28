const { Router } = require('express')
const sessionController = require('../controllers/sessionController')

const sessionRouter = Router();


// /sessions route
sessionRouter.post('/ready', sessionController.markReady)
sessionRouter.get('/me', sessionController.getSessions)
sessionRouter.post('/complete', sessionController.completeSession)
sessionRouter.get('/:id', sessionController.getSessionById)
sessionRouter.post('/decline', sessionController.declineSession)


module.exports = sessionRouter