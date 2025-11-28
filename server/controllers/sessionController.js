const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

const markReady = [
    auth,
    async (req, res) => {
        try {
            const { sessionId } = req.body;
            const { userId } = req.user;

            const session = await prisma.session.findUnique({
                where: { id: sessionId }
            });

            if (!session) {
                res.status(404).json({ error: "Session not found" });
            }

            let updateData = {};

            if (session.mentorId === userId) {
                updateData.mentorReady = true;
            } else if (session.learnerId === userId) {
                updateData.learnerReady = true;
            } else {
                res.status(403).json({ error: "Not part of this session" });
            }

            const updated = await prisma.session.update({
                where: { id: sessionId },
                data: updateData
            });

            if (updated.mentorReady && updated.learnerReady) {
                const started = await prisma.session.update({
                    where: { id: sessionId },
                    data: {
                        status: "active",
                        startAt: new Date()
                    }
                });
                return res.status(200).json({
                    message: "Both users ready. Session started.",
                    session: started
                });
            }

            res.status(200).json({
                message: "Marked ready. Waiting on the other person.",
                session: updated
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to update readiness" });
        }
    }
];

const endSession = [
    auth,
    async (req, res) => {
        try {
            const { sessionId } = req.body;

            const session = await prisma.session.update({
                where: { id: sessionId },
                data: {
                    endAt: new Date(),
                    status: "ended"
                }
            });

            res.status(200).json({ message: "Session ended", session });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to end session" });
        }
    }
];

const rateSession = [
    auth,
    async (req, res) => {
        try {
            const { sessionId, rating } = req.body;

            const session = await prisma.session.update({
                where: { id: sessionId },
                data: { rating }
            });

            res.status(200).json({ message: "Rating submitted", session });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to rate session" });
        }
    }
];

const getSessions = [
    auth,
    async (req, res) => {
        try {
            const { userId } = req.user;

            const sessions = await prisma.session.findMany({
                where: {
                    OR: [
                        { mentorId: userId },
                        { learnerId: userId }
                    ]
                },
                include: {
                    helpRequest: {
                        include: { skill: true }
                    },
                    mentor: true,
                    learner: true
                }
            });

            res.status(200).json(sessions);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to get sessions" });
        }
    }
];

const getSessionById = [
    auth,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.user;

            const session = await prisma.session.findUnique({
                where: { id: Number(id) },
                include: {
                    helpRequest: { include: { skill: true } },
                    mentor: true,
                    learner: true,
                    messages: true
                }
            });

            if (!session) {
                return res.status(404).json({ error: "Session not found" });
            }

            if (session.mentorId !== userId && session.learnerId !== userId) {
                return res.status(403).json({ error: "Not allowed" });
            }

            res.status(200).json(session);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to get session" });
        }
    }
];

module.exports = {
    markReady,
    endSession,
    rateSession,
    getSessions,
    getSessionById
}
