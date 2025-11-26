const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
require('dotenv').config()

async function registerUser(req, res){
    try {
        const { name, email, password } = req.body;

        const hashed = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed
            }
        })
        
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        })

        res.status(201).json({ token, user })
    }
    catch (err) {
        console.error(err)
        res.status(400).json({ error: "Registration Failed" })
    }
}

async function loginUser(req, res){
    try {
        const { email, password } = req.body

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if (!user) return res.status(400).json({ error: "Invalid credentials"});

        const match = await bcrypt.compare(password, user.password)
        if (!match){
            return res.status(400).json({ error: "Invalid credentials"} )
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        })
        res.status(200).json({ token, user })
    }
    catch (err) {
        console.err(err)
        res.status(400).json({ error: "Login Failed"} )
    }
}

async function getUserProfile(req, res){
    try {
        const { userId } = req.user

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
                include: { userSkills: true }
            }
        })
        res.status(200).json(user)
    }
    catch (err) {
        console.error(err)
        res.status(400).json({ error: "Failed to fetch profile "})
    }
}

module.exports = {
    registerUser,
    loginUser,
    getUserProfile
}