const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwtAuth = require('../middleware/auth');

const getHelpRequests = [
    jwtAuth,
    async (req, res) => {
        try {
            const { userId } = req.user

            const helpRequests = await prisma.helpRequest.findMany({
                where: {
                    requesterId: userId,
                },
                include: {
                    skill: true,
                    session: true
                }
            });

            res.status(200).json(helpRequests)
        }
        catch (err) {
            console.error(err)
            res.status(400).json({ error: "Failed to fetch help requests"} )
        }
    }
]

const createHelpRequest = [
    jwtAuth,
    async (req, res) => {
        try {
            const { userId } = req.user
            const { skillId } = req.body

            const request = await prisma.helpRequest.create({
                data: {
                    requesterId: userId,
                    skillId,
                }
            })

            const mentorSkill = await prisma.userSkill.findFirst({
                where: {
                    skillId,
                    role: "mentor"
                },
                include: {
                    user: true
                }
            });

            if (!mentorSkill) {
                return res.status(200).json({
                    message: "Help request created but no mentor available",
                    status: "pending",
                    helpRequest: request
                });
            }

            const session = await prisma.session.create({
                data: {
                    helpRequestId: request.id,
                    mentorId: mentorSkill.user.id,
                    learnerId: userId
                }
            });

            await prisma.helpRequest.update({
                where: { id: request.id },
                data: { status: "matched" }
            });

            return res.status(201).json({
                message: "Matched with mentor",
                status: "matched",
                session,
                helpRequest: request
            });

        }
        catch (err) {
            console.error(err)
            res.status(400).json({ error: "Failed to create help request"} )
        }
    }
]

const cancelHelpRequest = [
    jwtAuth,
    async (req, res) => {
        try {
            const { userId } = req.user;

            const helpRequest = await prisma.helpRequest.findFirst({
                where: { requesterId: userId, status: "pending" }
            });

            if (!helpRequest) {
                return res.status(404).json({ error: "No active help request to cancel" });
            }

            await prisma.helpRequest.update({
                where: { id: helpRequest.id },
                data: { status: "cancelled" }
            });

            return res.json({ message: "Help request cancelled" });
        } catch (err) {
            console.error("cancelHelpRequest error:", err);
            return res.status(500).json({ error: "Server error" });
        }

    }
]

module.exports = {
    getHelpRequests,
    createHelpRequest,
    cancelHelpRequest
}

