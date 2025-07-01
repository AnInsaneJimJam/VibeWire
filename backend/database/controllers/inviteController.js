import Invite from '../models/invite.model.js';
import User from '../models/user.model.js';
import Hangout from '../models/hangout.model.js';

export const getInvites = async (req, res) => {
  try {
    const userId = req.user.id;

    const invites = await Invite.findAll({
      where: {
        recipientId: userId,
        status: 'pending_response',
      },
      include: [
        { model: Hangout, as: 'hangout' },
        { model: User, as: 'sender' },
      ],
    });

    const approvalRequests = await Invite.findAll({
      where: {
        approverId: userId,
        status: 'pending_approval',
      },
      include: [
        { model: Hangout, as: 'hangout' },
        { model: User, as: 'sender' },
      ],
    });

    res.status(200).json({ invites, approvalRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


export const respondToInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { response } = req.body; // 'accepted' or 'declined'
    const userId = req.user.id;

    const invite = await Invite.findByPk(inviteId);

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.recipientId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to respond to this invite' });
    }

    invite.status = response;
    await invite.save();

    if (response === 'accepted') {
      // Check if the hangout is now confirmed
      const hangout = await Hangout.findByPk(invite.hangoutId, {
        include: [{ model: Invite, as: 'invites' }],
      });

      const acceptedInvites = hangout.invites.filter(
        (i) => i.status === 'accepted'
      );

      if (acceptedInvites.length >= 2) {
        hangout.status = 'confirmed';
        await hangout.save();
        
        // Add HAS_HUNG_OUT_WITH relationship
        const session = neo4jDriver.session();
        try {
          for (const acceptedInvite of acceptedInvites) {
            await session.run(
              `
              MATCH (u1:User {userId: $userId1})
              MATCH (u2:User {userId: $userId2})
              MERGE (u1)-[:HAS_HUNG_OUT_WITH]->(u2)
              `,
              { userId1: hangout.hostId, userId2: acceptedInvite.recipientId }
            );
          }
        } finally {
          await session.close();
        }

        // Here you would typically send a notification to all participants
      }
    }

    res.status(200).json(invite);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const respondToApproval = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { response } = req.body; // 'approved' or 'denied'
    const userId = req.user.id;

    const invite = await Invite.findByPk(inviteId);

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.approverId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to approve this invite' });
    }

    if (response === 'approved') {
      invite.status = 'pending_response';
    } else {
      invite.status = 'denied';
    }
    await invite.save();

    res.status(200).json(invite);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
