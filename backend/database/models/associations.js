import User from './user.model.js';
import Hangout from './hangout.model.js';
import Invite from './invite.model.js';

// A User can host many Hangouts
User.hasMany(Hangout, { foreignKey: 'hostId', as: 'hostedHangouts' });
Hangout.belongsTo(User, { foreignKey: 'hostId', as: 'host' });

// A Hangout can have many Invites
Hangout.hasMany(Invite, { foreignKey: 'hangoutId' });
Invite.belongsTo(Hangout, { foreignKey: 'hangoutId' });

// An Invite is sent by a User (sender)
User.hasMany(Invite, { foreignKey: 'senderId', as: 'sentInvites' });
Invite.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// An Invite is sent to a User (recipient)
User.hasMany(Invite, { foreignKey: 'recipientId', as: 'receivedInvites' });
Invite.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

// An Invite can be approved by a User (approver)
User.hasMany(Invite, { foreignKey: 'approverId', as: 'approvalRequests' });
Invite.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

console.log("Sequelize associations have been configured.");