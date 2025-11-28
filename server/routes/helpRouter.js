const { Router } = require('express')
const helpController = require('../controllers/helpController')

const helpRouter = Router();


// /help or /request route
helpRouter.post('/', helpController.createHelpRequest)
helpRouter.get('/me', helpController.getHelpRequests)
helpRouter.post('/cancel', helpController.cancelHelpRequest)

module.exports = helpRouter