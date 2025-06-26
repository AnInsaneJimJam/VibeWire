import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Invite = sequelize.define(
    "Invite",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        status: {
            type: DataTypes.ENUM(
                'pending_approval', // Waiting for a mutual friend to approve
                'pending_response', // Waiting for the guest to accept/decline
                'accepted',
                'declined',
                'denied' // When a mutual friend denies the request
            ),
            allowNull: false,
        },
        // Foreign key for the user who needs to approve this (for 2nd-degree invites)
        approverId: {
            type: DataTypes.INTEGER,
            allowNull: true, // Null if it's a 1st-degree invite
            references: {
                model: 'users',
                key: 'id'
            }
        }
    },
    {
        tableName: "invites",
        timestamps: true
    }
);

export default Invite;