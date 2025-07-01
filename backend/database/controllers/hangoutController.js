import Hangout from '../models/hangout.model.js';
import Invite from '../models/invite.model.js';
import User from '../models/user.model.js';
import { neo4jDriver } from '../config/database.js';

export const getHangouts = async (req, res) => {
  try {
    const userId = req.user.id;
    const hangouts = await Hangout.findAll({
      include: [
        {
          model: User,
          as: 'host',
          attributes: ['id', 'name', 'profileImage'],
        },
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'name', 'profileImage'],
          through: { attributes: [] },
          where: { id: userId },
        },
      ],
    });
    res.status(200).json(hangouts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const createHangout = async (req, res) => {
  const session = neo4jDriver.session();
  try {
    const { title, participantIds, date, time, venue, description, maxParticipants } = req.body;
    const hostId = req.user.id;

    // Create the hangout
    const hangout = await Hangout.create({
      title,
      hostId,
      date,
      time,
      venue,
      description,
      maxParticipants,
    });

    // Create the invites
    for (const participantId of participantIds) {
      // Check if the participant is a 1st or 2nd degree connection
      const result = await session.run(
        `
        MATCH (host:User {userId: $hostId})
        MATCH (participant:User {userId: $participantId})
        OPTIONAL MATCH (host)-[:IS_FRIENDS_WITH]-(participant)
        OPTIONAL MATCH (host)-[:IS_FRIENDS_WITH]-(mutual)-[:IS_FRIENDS_WITH]-(participant)
        RETURN participant, mutual
        `,
        { hostId, participantId }
      );

      const record = result.records[0];
      if (record) {
        const participant = record.get('participant');
        const mutual = record.get('mutual');

        if (participant) {
          // 1st degree connection
          await Invite.create({
            hangoutId: hangout.id,
            senderId: hostId,
            recipientId: participantId,
            status: 'pending_response',
          });
        } else if (mutual) {
          // 2nd degree connection
          await Invite.create({
            hangoutId: hangout.id,
            senderId: hostId,
            recipientId: participantId,
            approverId: mutual.properties.userId,
            status: 'pending_approval',
          });
        }
      }
    }

    res.status(201).json(hangout);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  } finally {
    await session.close();
  }
};
