import { neo4jDriver } from "../config/database.js";

/**
 * @desc    Get all 1st degree connections for the logged-in user
 * @route   GET /api/connections
 * @access  Private
 */
export const getConnections = async (req, res) => {
    const session = neo4jDriver.session();
    try {
        const userId = req.user.id;

        // This query now aliases userId to id and ensures all required fields are present
        const query = `
            MATCH (u:User {userId: $userId})-[:IS_FRIENDS_WITH]-(friend:User)
            RETURN friend { 
                id: friend.userId, 
                name: friend.name, 
                bio: friend.bio, 
                image: coalesce(friend.profileImage, 'https://via.placeholder.com/150'), 
                course: friend.course, 
                year: friend.year, 
                bhawan: friend.bhawan 
            } AS connection
        `;

        const result = await session.run(query, { userId });
        const connections = result.records.map(record => record.get('connection'));

        res.status(200).json(connections);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    } finally {
        await session.close();
    }
};

/**
 * @desc    Create friendships for the logged-in user
 * @route   POST /api/connections
 * @access  Private
 */
export const addConnections = async (req, res) => {
    const session = neo4jDriver.session();
    try {
        const { friendIds } = req.body; // Expect an array of friend Postgres IDs
        const userId = req.user.id; // Logged-in user's Postgres ID

        if (!friendIds || !Array.isArray(friendIds)) {
            return res.status(400).json({ message: "Please provide an array of friendIds." });
        }

        // This single Cypher query creates all relationships in one go. It's very efficient.
        // It finds the user (u) and then for each friendId in the list, finds that friend (f)
        // and creates a two-way friendship.
        const query = `
            MATCH (u:User {userId: $userId})
            UNWIND $friendIds AS friendId
            MATCH (f:User {userId: friendId})
            MERGE (u)-[r1:IS_FRIENDS_WITH]->(f)
            MERGE (f)-[r2:IS_FRIENDS_WITH]->(u)
        `;
        
        await session.run(query, { userId, friendIds });

        res.status(200).json({ message: `Connections added for ${friendIds.length} friends.` });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    } finally {
        await session.close();
    }
};

/**
 * @desc    Get the full 1st and 2nd degree connection graph
 * @route   GET /api/connections/graph
 * @access  Private
 */
export const getConnectionsGraph = async (req, res) => {
    const session = neo4jDriver.session();
    try {
        const userId = req.user.id;

        // This query now aliases userId to id and provides a default for the image
        const query = `
            MATCH (me:User {userId: $userId})
            
            OPTIONAL MATCH (me)-[:IS_FRIENDS_WITH]-(friend:User)
            
            OPTIONAL MATCH (friend)-[:IS_FRIENDS_WITH]-(friendOfFriend:User)
            WHERE friendOfFriend <> me AND NOT (me)-[:IS_FRIENDS_WITH]-(friendOfFriend)

            RETURN 
                me { id: me.userId, name: me.name, bio: me.bio, image: coalesce(me.profileImage, 'https://via.placeholder.com/150') } as user, 
                collect(DISTINCT friend { id: friend.userId, name: friend.name, bio: friend.bio, image: coalesce(friend.profileImage, 'https://via.placeholder.com/150') }) as firstDegree, 
                collect(DISTINCT friendOfFriend { id: friendOfFriend.userId, name: friendOfFriend.name, bio: friendOfFriend.bio, image: coalesce(friendOfFriend.profileImage, 'https://via.placeholder.com/150') }) as secondDegree
        `;

        const result = await session.run(query, { userId });

        const record = result.records[0];
        if (!record) {
            return res.status(404).json({ message: "User not found in graph." });
        }
        
        const graph = {
            user: record.get('user'),
            firstDegree: record.get('firstDegree').filter(Boolean), // Ensure no nulls in array
            secondDegree: record.get('secondDegree').filter(Boolean) // Ensure no nulls in array
        };
        
        res.status(200).json(graph);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    } finally {
        await session.close();
    }
};