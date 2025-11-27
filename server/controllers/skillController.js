const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

async function getSkills(req, res){
    try {
        const skills = await prisma.skill.findMany();
        res.status(200).json(skills)
    }
    catch (err) {
        console.error(err)
        res.status(400).json({ error: "Failed to fetch skills"})
    }
}

