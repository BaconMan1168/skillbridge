const { Router } = require('express')
const skillController = require('../controllers/skillController')

const skillRouter = Router();

skillRouter.get('/', skillController.getSkills)
skillRouter.put('/me', skillController.setSkills)

module.exports = skillRouter
