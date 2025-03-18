import express, { Request, Response } from "express";
import axios from "axios";
import { MongoClient } from "mongodb";

// Express app setup
const app = express();
app.use(express.json());

// MongoDB setup
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/node_assignment";
;

const client = new MongoClient(MONGO_URI);
const dbName = "node_assignment";
let db: any;

async function connectDB() {
  await client.connect();
  db = client.db(dbName);
  console.log("Connected to MongoDB");
}
connectDB();

// Define types for MongoDB documents
interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  posts?: Post[];
}

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
  comments?: Comment[];
}

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

// Load users from JSONPlaceholder
app.get("/load", async (_req: Request, res: Response) => {
  try {
    const users = (await axios.get<User[]>("https://jsonplaceholder.typicode.com/users")).data;
const posts = (await axios.get<Post[]>("https://jsonplaceholder.typicode.com/posts")).data;
const comments = (await axios.get<Comment[]>("https://jsonplaceholder.typicode.com/comments")).data;


    // Associate posts and comments with users
    const usersWithPosts = users.map((user) => {
      const userPosts = posts.filter((post) => post.userId === user.id);
      userPosts.forEach((post) => {
        post.comments = comments.filter((comment) => comment.postId === post.id);
      });
      return { ...user, posts: userPosts };
    });

    await db.collection("users").insertMany(usersWithPosts);
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to load users" });
  }
});

// Delete all users
app.delete("/users", async (_req: Request, res: Response) => {
  try {
    await db.collection("users").deleteMany({});
    res.status(200).json({ message: "All users deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete users" });
  }
});

// Delete specific user
app.delete("/users/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await db.collection("users").deleteOne({ id: userId });

    if (result.deletedCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});


// Get specific user
app.get("/users/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await db.collection("users").findOne({ id: userId });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});




// Add new user
app.put("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const newUser: User = req.body;
    const existingUser = await db.collection("users").findOne({ id: newUser.id });

    if (existingUser) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    await db.collection("users").insertOne(newUser);
    res.status(201).json({ message: "User added", link: `/users/${newUser.id}` });
  } catch (error) {
    res.status(500).json({ error: "Failed to add user" });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
