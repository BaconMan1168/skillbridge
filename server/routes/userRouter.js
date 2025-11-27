const { Router } = require('express')
const userController = require('../controllers/userController')


const userRouter = Router();

// /users route
userRouter.post('/register', userController.registerUser)
userRouter.post('/login', userController.loginUser)
userRouter.get('/me', userController.getUserProfile)

module.exports = userRouter