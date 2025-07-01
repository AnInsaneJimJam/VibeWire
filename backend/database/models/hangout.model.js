import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Hangout = sequelize.define(
    "Hangout",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "e.g., 'Grabbing food at Cyber Hub?'"
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        time: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        venue: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        maxParticipants: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('upcoming', 'ongoing', 'completed'),
            defaultValue: 'upcoming',
        },
        // The host of the hangout is a foreign key to the User model
        hostId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users', // table name
                key: 'id'
            }
        }
    },
    {
        tableName: "hangouts",
        timestamps: true,
    }
);

export default Hangout;