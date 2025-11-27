const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

const matchMentor = [
    auth,
    async (req, res) => {
        try {
            const { helpRequestId } = req.body;
            const { userId } = req.user;

            const request = await prisma.helpRequest.findUnique({
                where: { id: helpRequestId }
            });

            if (!request) {
                return res.status(404).json({ error: "Help request not found" });
            }

            const mentor = await prisma.userSkill.findFirst({
                where: {
                    skillId: request.skillId,
                    role: "mentor"
                },
                include: {
                    user: true
                }
            });

            if (!mentor) {
                return res.status(400).json({ error: "No mentor available with that skill" });
            }

            const session = await prisma.session.create({
                data: {
                    helpRequestId: request.id,
                    learnerId: userId,
                    mentorId: mentor.user.id,
                    startAt: new Date()
                }
            });

            await prisma.helpRequest.update({
                where: { id: request.id },
                data: { status: "matched" }
            });

            res.status(201).json({
                message: "Match successful",
                session
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Matchmaking failed" });
        }
    }
]

module.exports = { matchMentor };