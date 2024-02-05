const express = require("express");
const cors = require("cors");
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");

require("dotenv").config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(12);
const jwtSecret = "apcmefnvbnwq";

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

connectToDatabase();

app.get("/test", (req, res) => {
  res.json("registered animalfffed use");
});

// booking -- EMrdLfOniVPWlSZb -- current IP address (47.203.35.62)
// mongodb+srv://booking:EMrdLfOniVPWlSZb@cluster0.iy1onj9.mongodb.net/?retryWrites=true&w=majority
// mongodb+srv://booking:<password>@cluster0.iy1onj9.mongodb.net/

app.post("/register", async (req, res) => {
  const { name, owner, email, password } = req.body;

  // Check if user with the same email already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    // Handle duplicate email error
    return res.status(400).json({ error: "Email already exists" });
  }

  // If no existing user, proceed with user creation
  const userDoc = await User.create({
    name,
    owner,
    email,
    password: bcrypt.hashSync(password, bcryptSalt),
  });

  res.json(userDoc);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc && bcrypt.compareSync(password, userDoc.password)) {
    jwt.sign(
      {
        email: userDoc.email,
        id: userDoc._id,
      },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json(userDoc);
      }
    );
  } else {
    res.status(401).json("Invalid Credentials");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { name, owner, email, _id } = await User.findById(userData.id);
      res.json({ name, owner, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

console.log({ __dirname });
app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = Date.now() + ".jpg";
  await imageDownloader.image({
    url: link,
    dest: __dirname + "/uploads" + newName,
  });
  res.json(__dirname + "/uploads" + newName)
});

app.listen(4000);
