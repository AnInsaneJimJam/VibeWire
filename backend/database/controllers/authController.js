import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: "30d", // Token will be valid for 30 days
	});
};

export const signup = async (req, res) => {
	try {
		const { name, phoneNumber, bio, password } = req.body;

		if (!name || !phoneNumber || !password) {
			return res
				.status(400)
				.json({
					message: "Please provide name, phone number, and password.",
				});
		}

		const userExists = await User.findOne({ where: { phoneNumber } });
		if (userExists) {
			return res
				.status(409)
				.json({
					message: "A user with this phone number already exists.",
				});
		}

		const newUser = await User.create({
			name,
			phoneNumber,
			bio,
			password,
		});

		if (newUser) {
			const token = generateToken(newUser.id);

			const userResponse = newUser.toJSON();
			delete userResponse.password;

			res.status(201).json({
				message: "User registered successfully!",
				token,
				user: userResponse,
			});
		} else {
			res.status(400).json({ message: "Invalid user data." });
		}
	} catch (error) {
		res.status(500).json({ message: "Server Error", error: error.message });
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
