import sequelize from "../config/database.js";
import { neo4jDriver } from "../config/database.js";
import Hangout from "../models/hangout.model.js";
import Invite from "../models/invite.model.js";
import User from "../models/user.model.js";
import { Op } from "sequelize";


/**
 * @desc    Create a new hangout and send invites
 * @route   POST /api/hangouts
 * @access  Private
 */
export const createHangout = async (req, res) => {
    // Use a transaction to ensure all or nothing is saved to the DB
    const transaction = await sequelize.transaction();
    const neo4jSession = neo4jDriver.session();
    
    try {
        const { title, inviteeIds } = req.body; // inviteeIds is an array of user IDs
        const hostId = req.user.id;

        // Step 1: Get the host's 1st-degree friends from Neo4j
        const firstDegreeResult = await neo4jSession.run(
            'MATCH (u:User {userId: $hostId})-[:IS_FRIENDS_WITH]-(friend:User) RETURN collect(friend.userId) as friendIds',
            { hostId }
        );
        const firstDegreeIds = firstDegreeResult.records[0].get('friendIds');

        // Step 2: Create the Hangout record in Postgres
        const hangout = await Hangout.create({ title, hostId }, { transaction });

        // Step 3: Process each invitee
        for (const inviteeId of inviteeIds) {
            if (firstDegreeIds.includes(inviteeId)) {
                // It's a 1st-degree friend, invite directly
                await Invite.create({
                    hangoutId: hangout.id,
                    senderId: hostId,
                    recipientId: inviteeId,
                    status: 'pending_response',
                }, { transaction });
            } else {
                // It's a 2nd-degree connection, requires approval
                // Find a mutual friend from Neo4j
                const mutualFriendResult = await neo4jSession.run(
                    `MATCH (h:User {userId: $hostId})-[:IS_FRIENDS_WITH]-(m:User)-[:IS_FRIENDS_WITH]-(g:User {userId: $inviteeId}) 
                     RETURN m.userId as mutualId LIMIT 1`,
                    { hostId, inviteeId }
                );

                if (mutualFriendResult.records.length === 0) {
                    // This case should ideally be prevented by the frontend, but as a safeguard:
                    console.warn(`No mutual friend found between ${hostId} and ${inviteeId}`);
                    continue; // Skip this invite
                }
                const approverId = mutualFriendResult.records[0].get('mutualId');

                await Invite.create({
                    hangoutId: hangout.id,
                    senderId: hostId,
                    recipientId: inviteeId,
                    approverId: approverId,
                    status: 'pending_approval',
                }, { transaction });
            }
        }

        // If all operations were successful, commit the transaction
        await transaction.commit();
        res.status(201).json({ message: "Hangout created and invites sent!", hangout });

    } catch (error) {
        // If any error occurred, rollback the transaction
        await transaction.rollback();
        res.status(500).json({ message: "Failed to create hangout", error: error.message });
    } finally {
        await neo4jSession.close();
    }
};


/**
 * @desc    Get all pending invites and approval requests for the logged-in user
 * @route   GET /api/hangouts/invites
 * @access  Private
 */
export const getMyInvites = async (req, res) => {
    try {
        const userId = req.user.id;

        const invites = await Invite.findAll({
            where: {
                [Op.or]: [
                    // Case 1: I am the recipient and the invite is waiting for my response
                    { recipientId: userId, status: 'pending_response' },
                    // Case 2: I am the approver and the invite is waiting for my approval
                    { approverId: userId, status: 'pending_approval' }
                ]
            },
            // Include related data to make the invites useful for the frontend
            include: [
                {
                    model: Hangout,
                    attributes: ['id', 'title']
                },
                {
                    model: User,
                    as: 'sender', // The person who created the hangout
                    attributes: ['id', 'name'] // Add profile picture URL here later
                },
                {
                    model: User,
                    as: 'recipient', // The final guest
                    attributes: ['id', 'name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(invites);

    } catch (error) {
        res.status(500).json({ message: "Failed to fetch invites", error: error.message });
    }
};

/**
 * @desc    Respond to a hangout invitation (accept or decline)
 * @route   POST /api/hangouts/invites/:inviteId/respond
 * @access  Private
 */
export const respondToInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;
        const { response } = req.body; // Expecting 'accepted' or 'declined'
        const userId = req.user.id;

        if (!['accepted', 'declined'].includes(response)) {
            return res.status(400).json({ message: "Invalid response. Must be 'accepted' or 'declined'." });
        }
        
        // Find the invite, ensuring it belongs to the logged-in user and is in the correct state
        const invite = await Invite.findOne({
            where: {
                id: inviteId,
                recipientId: userId,
                status: 'pending_response'
            }
        });

        if (!invite) {
            return res.status(404).json({ message: "Invite not found, it may have expired, or you are not authorized to respond." });
        }

        // Update the status
        invite.status = response;
        await invite.save();

        res.status(200).json({ message: `You have ${response} the invite.`, invite });

    } catch (error) {
        res.status(500).json({ message: "Failed to respond to invite", error: error.message });
    }
};

/**
 * @desc    Approve or deny a 2nd-degree connection's invite
 * @route   POST /api/hangouts/invites/:inviteId/approve
 * @access  Private
 */
export const approveInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;
        const { approval } = req.body; // Expecting 'approved' or 'denied'
        const userId = req.user.id;

        if (!['approved', 'denied'].includes(approval)) {
            return res.status(400).json({ message: "Invalid approval. Must be 'approved' or 'denied'." });
        }

        // Find the invite, ensuring the user is the designated approver and it's in the correct state
        const invite = await Invite.findOne({
            where: {
                id: inviteId,
                approverId: userId,
                status: 'pending_approval'
            }
        });

        if (!invite) {
            return res.status(404).json({ message: "Approval request not found or you are not authorized." });
        }
        
        // Update the status based on the approval
        if (approval === 'approved') {
            invite.status = 'pending_response'; // Now the recipient can see and respond to it
        } else { // 'denied'
            invite.status = 'denied';
        }
        await invite.save();

        res.status(200).json({ message: `You have ${approval} the invite request.`, invite });

    } catch (error) {
        res.status(500).json({ message: "Failed to process approval", error: error.message });
    }
};