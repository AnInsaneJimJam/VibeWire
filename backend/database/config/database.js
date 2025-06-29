import { Sequelize } from "sequelize";
import neo4j from "neo4j-driver";
import 'dotenv/config';

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !user || !password) {
    throw new Error("Missing Neo4j connection details in .env file");
}

export const neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const sequelize = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USER,
	process.env.DB_PASSWORD,
	{
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		dialect: "postgres"
	}
);

export const connectToNeo4j = async () => {
    try {
        await neo4jDriver.verifyConnectivity();
        console.log("Successfully connected to Neo4j.");
    } catch (error) {
        console.error("Could not connect to Neo4j.", error);
        await neo4jDriver.close();
        process.exit(1);
    }
};

export default sequelize;
