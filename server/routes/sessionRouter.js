const { Router } = require('express')
const sessionController = require('../controllers/sessionController')

const sessionRouter = Router();


// /sessions route
sessionRouter.post('/ready', sessionController.markReady)
sessionRouter.get('/me', sessionController.getSessions)
sessionRouter.post('/complete', completeSession)
sessionRouter.get('/:id', sessionController.getSessionById)

module.exports = sessionRouter