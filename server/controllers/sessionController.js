const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwtAuth = require('../middleware/auth');

const markReady = [
    jwtAuth,
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

            return res.status(200).json({
                message: "Marked ready. Waiting on the other person.",
                session: updated
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to update readiness" });
        }
    }
];

const completeSession = [
    jwtAuth,
    async (req, res) => {
        try {
            const { sessionId, rating } = req.body;
            const { userId } = req.user;

            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ error: "Rating must be 1-5" });
            }

            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: { mentor: true }
            });

            if (!session) {
                return res.status(404).json({ error: "Session not found" });
            }

            if (session.status === "completed") {
                return res.status(400).json({ error: "Session already completed" });
            }

            const updatedSession = await prisma.session.update({
                where: { id: sessionId },
                data: {
                    status: "completed",
                    endAt: new Date(),
                    rating
                }
            });

            const mentor = session.mentor;

            const newSessionsCompleted = mentor.sessionsCompleted + 1;
            
            let newRating;
            if (mentor.sessionsCompleted === 0){
                newRating = rating
            }
            else {
                newRating = (mentor.rating * mentor.sessionsCompleted + rating) / newSessionsCompleted
            }

            await prisma.user.update({
                where: { id: mentor.id },
                data: {
                    sessionsCompleted: newSessionsCompleted,
                    rating: newRating
                }
            });

            return res.status(200).json({
                message: "Session completed and mentor rated.",
                session: updatedSession
            });

        } catch (err) {
            console.error("completeSession error:", err);
            res.status(500).json({ error: "Failed to complete session" });
        }
    }
];

const getSessions = [
    jwtAuth,
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
    jwtAuth,
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

const declineSession = [
    jwtAuth,
    async (req, res) => {
        try {
            const { userId } = req.user;
            const { sessionId } = req.body;

            const session = await prisma.session.findUnique({ where: { id: sessionId }});

            if (!session) return res.status(404).json({ error: "Session not found" });

            if (session.mentorId !== userId) {
                return res.status(403).json({ error: "Only the mentor can decline" });
            }

            await prisma.session.update({
                where: { id: sessionId },
                data: { status: "declined" }
            });

            await prisma.helpRequest.update({
                where: { id: session.helpRequestId },
                data: { status: "pending" }
            });

            res.status(200).json({ message: "Match declined" });
        } catch (err) {
            console.error("declineMatch error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
]

module.exports = {
    markReady,
    completeSession,
    getSessions,
    getSessionById,
    declineSession
}
