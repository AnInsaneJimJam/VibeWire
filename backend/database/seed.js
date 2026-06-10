import sequelize from './config/database.js';
import User from './models/user.model.js';
import Invite from './models/invite.model.js';
import Hangout from './models/hangout.model.js';
import { neo4jDriver } from './config/database.js';
import './models/associations.js';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const usersData = [
  {
    name: 'Anand Bansal',
    phoneNumber: '9999999999',
    password: 'password123',
    bio: 'Software engineer & tech enthusiast. Love to build awesome apps!',
    profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    course: 'B.Tech CSE',
    year: '3rd Year',
    bhawan: 'Rajendra Bhawan'
  },
  {
    name: 'Aayush Bhoj',
    phoneNumber: '9876543210',
    password: 'password123',
    bio: 'Product Designer. Always looking for clean aesthetics and smooth animations.',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    course: 'B.Des',
    year: '3rd Year',
    bhawan: 'Radhakrishnan Bhawan'
  },
  {
    name: 'Rahul Sharma',
    phoneNumber: '9876543211',
    password: 'password123',
    bio: 'Competitive programmer and movie buff. Let\'s grab some coffee!',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    course: 'B.Tech ECE',
    year: '4th Year',
    bhawan: 'Cautley Bhawan'
  },
  {
    name: 'Priya Patel',
    phoneNumber: '9876543212',
    password: 'password123',
    bio: 'Avid reader and classical dancer. Exploring the intersections of tech and art.',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    course: 'B.Tech Biotech',
    year: '2nd Year',
    bhawan: 'Sarojini Bhawan'
  },
  {
    name: 'Amit Verma',
    phoneNumber: '9876543213',
    password: 'password123',
    bio: 'Machine learning explorer. Coffee and neural networks are my fuel.',
    profileImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    course: 'B.Tech CSE',
    year: '3rd Year',
    bhawan: 'Rajendra Bhawan'
  },
  {
    name: 'Sneha Reddy',
    phoneNumber: '9876543214',
    password: 'password123',
    bio: 'Musician & software developer. Jam sessions are always welcome!',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    course: 'Int. M.Tech Maths',
    year: '4th Year',
    bhawan: 'Kasturba Bhawan'
  },
  {
    name: 'Vikram Singh',
    phoneNumber: '9876543215',
    password: 'password123',
    bio: 'Basketball player & tech enthusiast. Catch me at the courts!',
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    course: 'B.Tech Mechanical',
    year: '3rd Year',
    bhawan: 'Govind Bhawan'
  },
  {
    name: 'Karan Malhotra',
    phoneNumber: '9876543216',
    password: 'password123',
    bio: 'Part-time photographer, full-time dreamer. Capturing vibes.',
    profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    course: 'B.Arch',
    year: '5th Year',
    bhawan: 'Azad Bhawan'
  },
  {
    name: 'Ananya Sen',
    phoneNumber: '9876543217',
    password: 'password123',
    bio: 'Debater, quizzer, and history geek. Let\'s talk about anything.',
    profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    course: 'B.Tech Chemical',
    year: '2nd Year',
    bhawan: 'Sarojini Bhawan'
  },
  {
    name: 'Rohan Gupta',
    phoneNumber: '9876543218',
    password: 'password123',
    bio: 'Fitness freak & open source contributor. Git commit everyday.',
    profileImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200',
    course: 'B.Tech CSE',
    year: '4th Year',
    bhawan: 'Ravindra Bhawan'
  },
  {
    name: 'Ishita Dutta',
    phoneNumber: '9876543219',
    password: 'password123',
    bio: 'Sketch artist and web developer. Creating beautiful frontends.',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    course: 'B.Des',
    year: '2nd Year',
    bhawan: 'Kasturba Bhawan'
  },
  {
    name: 'Kabir Mehta',
    phoneNumber: '9876543220',
    password: 'password123',
    bio: 'Standup comedy fan and app developer. Coding with a smile.',
    profileImage: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&q=80&w=200',
    course: 'B.Tech Engineering Physics',
    year: '3rd Year',
    bhawan: 'Rajendra Bhawan'
  }
];

// Define friendships (pairs of array indices)
const friendshipPairs = [
  [0, 1], // Anand <-> Aayush
  [0, 2], // Anand <-> Rahul
  [0, 3], // Anand <-> Priya
  [0, 4], // Anand <-> Amit
  [1, 5], // Aayush <-> Sneha (2nd degree to Anand)
  [1, 6], // Aayush <-> Vikram (2nd degree to Anand)
  [2, 7], // Rahul <-> Karan (2nd degree to Anand)
  [3, 8], // Priya <-> Ananya (2nd degree to Anand)
  [4, 9], // Amit <-> Rohan (2nd degree to Anand)
  [5, 10], // Sneha <-> Ishita
  [6, 11], // Vikram <-> Kabir
  [1, 2], // Aayush <-> Rahul
  [3, 4], // Priya <-> Amit
  [7, 9], // Karan <-> Rohan
  [8, 10], // Ananya <-> Ishita
];

async function seed() {
  console.log('🌱 Starting database seeding...');
  const neo4jSession = neo4jDriver.session();

  try {
    // 1. Force sync PostgreSQL tables
    await sequelize.sync({ force: true });
    console.log('✅ PostgreSQL tables recreated.');

    // 2. Clear Neo4j
    await neo4jSession.run('MATCH (n) DETACH DELETE n');
    console.log('✅ Neo4j database cleared.');

    // 3. Create users in PostgreSQL and Neo4j
    const createdUsers = [];
    for (const userData of usersData) {
      // Create in Postgres (password is hashed via model hook)
      const user = await User.create({
        name: userData.name,
        phoneNumber: userData.phoneNumber,
        password: userData.password,
        bio: userData.bio,
        profileImage: userData.profileImage,
      });

      createdUsers.push(user);

      // Create in Neo4j
      await neo4jSession.run(
        `
        CREATE (u:User {
          userId: $userId,
          name: $name,
          bio: $bio,
          profileImage: $profileImage,
          course: $course,
          year: $year,
          bhawan: $bhawan
        })
        `,
        {
          userId: user.id,
          name: userData.name,
          bio: userData.bio,
          profileImage: userData.profileImage,
          course: userData.course,
          year: userData.year,
          bhawan: userData.bhawan,
        }
      );
    }
    console.log(`✅ Created ${createdUsers.length} users in PostgreSQL and Neo4j.`);

    // 4. Create friendships in Neo4j
    for (const pair of friendshipPairs) {
      const u1 = createdUsers[pair[0]];
      const u2 = createdUsers[pair[1]];

      await neo4jSession.run(
        `
        MATCH (u1:User {userId: $userId1})
        MATCH (u2:User {userId: $userId2})
        MERGE (u1)-[:IS_FRIENDS_WITH]->(u2)
        MERGE (u2)-[:IS_FRIENDS_WITH]->(u1)
        `,
        {
          userId1: u1.id,
          userId2: u2.id,
        }
      );
    }
    console.log(`✅ Created ${friendshipPairs.length} mutual friendships in Neo4j.`);

    // 5. Create some sample Hangouts and Invites
    // Anand (User 0) hosts a Hangout
    const hangout1 = await Hangout.create({
      title: 'Coding Marathon 🚀',
      date: '2026-06-15',
      time: '18:00',
      venue: 'MAC Cafeteria',
      description: 'Building VibeWire features overnight!',
      maxParticipants: 5,
      hostId: createdUsers[0].id,
    });

    // Create participant records
    await hangout1.addParticipants([createdUsers[0], createdUsers[1], createdUsers[2]]);

    // Send invites
    await Invite.create({
      hangoutId: hangout1.id,
      senderId: createdUsers[0].id,
      recipientId: createdUsers[3].id,
      status: 'pending_response',
    });

    await Invite.create({
      hangoutId: hangout1.id,
      senderId: createdUsers[0].id,
      recipientId: createdUsers[4].id,
      status: 'pending_response',
    });

    // Aayush (User 1) hosts another Hangout
    const hangout2 = await Hangout.create({
      title: 'Design Critique & Chai ☕',
      date: '2026-06-18',
      time: '17:00',
      venue: 'Nescafe Kiosk',
      description: 'Reviewing UI designs over some hot ginger tea.',
      maxParticipants: 4,
      hostId: createdUsers[1].id,
    });
    await hangout2.addParticipants([createdUsers[1], createdUsers[0]]);

    console.log('✅ Created mock hangouts and invites.');
    console.log('🎉 Database seeding complete!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await neo4jSession.close();
    await sequelize.close();
    process.exit(0);
  }
}

seed();
