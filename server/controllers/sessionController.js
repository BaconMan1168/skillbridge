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
                res.status(200).json({
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



