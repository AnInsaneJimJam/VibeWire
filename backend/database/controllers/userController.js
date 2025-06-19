import User from "../models/user.model.js";


export async function getAllUsers(req, res) {
	try {
		const users = await User.findAll({
			attributes: { exclude: ["password"] },
		});
		res.status(200).json(users);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

export async function getUserById(req, res) {
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
}
