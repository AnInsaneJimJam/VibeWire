const User = require("../models/User");

// GET all users (publicly accessible)
exports.getAllUsers = async (req, res) => {
	try {
		const users = await User.findAll({
			attributes: { exclude: ["password"] }, // Don't send passwords back
		});
		res.status(200).json(users);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// GET a single user by ID (publicly accessible)
exports.getUserById = async (req, res) => {
	try {
		const user = await User.findByPk(req.params.id, {
			attributes: { exclude: ["password"] },
		});
		if (user) {
			res.status(200).json(user);
		} else {
			res.status(404).json({ error: "User not found" });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
