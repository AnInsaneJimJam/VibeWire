import { DataTypes } from "sequelize";
import { define } from "../config/database";

const User = define(
	"User",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		bio: {
			type: DataTypes.TEXT,
			allowNull: true, 
		},
		phoneNumber: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true, // Each phone number must be unique
		}, password: {
            type: DataTypes.STRING,
            allowNull: false,
        }
	},
	{
		tableName: "users",
		timestamps: true, 
	}
);

export default User;
