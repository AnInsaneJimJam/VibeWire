import express from "express";
import "dotenv/config";
import sequelize from "./database/config/database.js";
import "./database/models/user.model.js"; 
import "./database/models/hangout.model.js";
import "./database/models/invite.model.js";
import "./database/models/associations.js";
// import "./database/models/connection.model.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { connectToNeo4j } from "./database/config/database.js";
import connectionRoutes from "./routes/connectionRoute.js";
import hangoutRoutes from './routes/hangoutRoute.js'

const app = express();
const PORT =  3000;

app.use(express.json()); 

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/connections", connectionRoutes);
app.use('/api/hangouts', hangoutRoutes);

async function startServer() {
	try {
		await sequelize.sync({ alter: true }); 
        console.log("Database synced successfully.");
        await connectToNeo4j();
		app.listen(PORT, '0.0.0.0', () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
}

startServer();
