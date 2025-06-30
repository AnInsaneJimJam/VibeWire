import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { neo4jDriver } from "../config/database.js";

const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: "30d", // Token will be valid for 30 days
	});
};

export const signup = async (req, res) => {
	const session = neo4jDriver.session();
	console.log('--- Signup request received ---');
	try {
		console.log('Request body:', req.body);
		console.log('Request file:', req.file);
		const { name, phoneNumber, bio, password } = req.body;
		const profileImage = req.file ? req.file.path : null;

		if (!name || !phoneNumber || !password) {
			console.log('Missing required fields');
			return res.status(400).json({ message: "Please provide name, phone number, and password." });
		}

		const userExists = await User.findOne({ where: { phoneNumber } });
		console.log('User exists:', !!userExists);
		if (userExists) {
			console.log('User with this phone number already exists');
			return res.status(409).json({ message: "A user with this phone number already exists." });
		}

		console.log('Creating new user...');
		const newUser = await User.create({
			name,
			phoneNumber,
			bio,
			password,
			profileImage,
		});
		console.log('New user created:', newUser.id);

		await session.run(
			'CREATE (u:User {userId: $userId, name: $name})',
			{ userId: newUser.id, name: newUser.name }
		);
		console.log('User node created in Neo4j');

		if (newUser) {
			const token = generateToken(newUser.id);

			const userResponse = newUser.toJSON();
			delete userResponse.password;

			console.log('Sending success response');
			res.status(201).json({
				message: "User registered successfully!",
				token,
				user: userResponse,
			});
		} else {
			console.log('Invalid user data');
			res.status(400).json({ message: "Invalid user data." });
		}
	} catch (error) {
		console.error('Signup error:', error);
		res.status(500).json({ message: "Server Error", error: error.message });
	} finally {
		await session.close(); // **Always close the session**
		console.log('Neo4j session closed');
	}
};


export const login = async (req, res) => {
	try {
		const { phoneNumber, password } = req.body;

		if (!phoneNumber || !password) {
			return res
				.status(400)
				.json({ message: "Please provide phone number and password." });
		}

		const user = await User.findOne({ where: { phoneNumber } });

		if (user && (await bcrypt.compare(password, user.password))) {
			const token = generateToken(user.id);

			const userResponse = user.toJSON();
			delete userResponse.password;

			res.status(200).json({
				message: "Login successful!",
				token,
				user: userResponse,
			});
		} else {
			res.status(401).json({ message: "Invalid credentials." });
		}
	} catch (error) {
		res.status(500).json({ message: "Server Error", error: error.message });
	}
};
