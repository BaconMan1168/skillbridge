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

const setSkills = [
    auth,
    async (req, res) => {
        try {
            const { userId } = req.user
            const { skills } = req.body

            await prisma.userSkill.deleteMany({
                where: {
                    userId: userId
                }
            })

            await prisma.userSkill.createMany({
                data: skills.map(s => ({
                    userId,
                    skillId: s.skillId,
                    role: s.role
                }))
            })

            res.status(200).json({ message: "Skills updated" })
        }
        catch (err) {
            console.error(err)
            res.status(400).json({ error: "Failed to update skills" })
        }
    }
]

module.exports = {
    getSkills,
    setSkills
}
