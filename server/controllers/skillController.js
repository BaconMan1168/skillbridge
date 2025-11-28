const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwtAuth = require('../middleware/auth');

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
    jwtAuth,
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

            const newlyAddedMentorSkills = skills
                .filter(s => s.role === "mentor")
                .map(s => s.skillId);

            const pendingRequests = await prisma.helpRequest.findMany({
                where: {
                    skillId: { in: newlyAddedMentorSkills },
                    status: "pending"
                }
            });

            for (let req of pendingRequests) {
                await prisma.session.create({
                    data: {
                        helpRequestId: req.id,
                        mentorId: userId,
                        learnerId: req.requesterId
                    }
                });

                await prisma.helpRequest.update({
                    where: { id: req.id },
                    data: { status: "matched" }
                });
            }

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
