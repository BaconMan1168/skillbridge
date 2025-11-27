const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

const getHelpRequests = [
    auth,
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