import express from "express";
import "dotenv/config";
import sequelize from "..database/config/database.js";
import "..database/models/user.model.js"; 
import "..database/models/connection.model.js";
import userRoutes from "./routes/userRoute.js";
import authRoutes from "..database/routes/authRoute.js";
import { connectToNeo4j } from "./config/neo4j.js";
import connectionRoutes from "./routes/connectionRoute.js";


const app = express();
const PORT =  3000;

app.use(express.json()); 

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/connections", connectionRoutes);
async function startServer() {
	try {
		await sequelize.sync({ alter: true }); 
        console.log("Database synced successfully.");
        await connectToNeo4j();
		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
}

startServer();
