import neo4jDriver from "../config/neo4j.js";

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

        // This single query does all the work!
        // 1. MATCH (me) - Find the logged in user.
        // 2. OPTIONAL MATCH (me)-[]-(friend) - Find all their friends (1st degree).
        // 3. OPTIONAL MATCH (friend)-[]-(friendOfFriend) - Find friends of friends (2nd degree).
        // 4. WHERE clause filters out `me` and direct friends from the 2nd degree list.
        // 5. RETURN collects unique nodes for each category.
        const query = `
            MATCH (me:User {userId: $userId})
            
            OPTIONAL MATCH (me)-[:IS_FRIENDS_WITH]-(friend:User)
            
            OPTIONAL MATCH (friend)-[:IS_FRIENDS_WITH]-(friendOfFriend:User)
            WHERE friendOfFriend <> me AND NOT (me)-[:IS_FRIENDS_WITH]-(friendOfFriend)

            RETURN 
                me {.*} as user, 
                collect(DISTINCT friend {.*}) as firstDegree, 
                collect(DISTINCT friendOfFriend {.*}) as secondDegree
        `;

        const result = await session.run(query, { userId });

        // The result from the driver needs a little formatting to be clean JSON
        const record = result.records[0];
        if (!record) {
            return res.status(404).json({ message: "User not found in graph." });
        }
        
        const graph = {
            user: record.get('user'),
            firstDegree: record.get('firstDegree'),
            secondDegree: record.get('secondDegree')
        };
        
        res.status(200).json(graph);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    } finally {
        await session.close();
    }
};