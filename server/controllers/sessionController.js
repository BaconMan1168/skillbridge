const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');



const startSession = [
    auth,
    async (req, res) => {
        try {
            const { helpRequestId, mentorId, learnerId } = req.body;

            if (!helpRequestId || !mentorId || !learnerId) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            const session = await prisma.session.create({
                data: {
                    helpRequestId,
                    mentorId,
                    learnerId
                }
            });

            return res.status(201).json(session);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to start session" });
        }
    }
]

