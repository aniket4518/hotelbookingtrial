const users = require("../models/usermodel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userctrl = {
    register: async (req, res) => {
        try {
            const { name, email, password} = req.body;

            // Validate input
            if (!name || !email || !password) {
                return res.status(400).json({ msg: "All fields are required." });
            }

            // Check if the email already exists
            const user = await users.findOne({ email });
            if (user) {
                return res.status(400).json({ msg: "Email already exists." });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 9);

            // Create a new user
            const newUser = new users({ name, email, password: hashedPassword});

            // Save the user to the database
            await newUser.save();

            // Generate access and refresh tokens
            const accesstoken = createAccessToken({ id: newUser._id });
            const refreshtoken = createRefreshToken({ id: newUser._id });

            // Set the refresh token as an HTTP-only cookie
            res.cookie("refreshtoken", refreshtoken, {
                httpOnly: true,
                path: "/user/refresh_token",
            });

            // Send the response (optionally include user info)
            res.json({ accesstoken, user: { id: newUser._id, email: newUser.email } });
        } catch (err) {
            console.error("Error in register:", err.message); // Log the error for debugging
            return res.status(500).json({ msg: "Something went wrong during registration." });
        }
    },
    refreshtoken: async (req,res) =>{
        const rf_token=req.cookies.refreshtoken
        res.send(rf_token)
    },
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find the user by email
            const user = await users.findOne({ email });
            if (!user) return res.status(400).json({ msg: "User not found. Please sign up first." });

            // Check if the password matches
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ msg: "Incorrect password." });

            // Generate access and refresh tokens
            const accesstoken = createAccessToken({ id: user._id });
            const refreshtoken = createRefreshToken({ id: user._id });

            // Set the refresh token as an HTTP-only cookie
            res.cookie("refreshtoken", refreshtoken, {
                httpOnly: true,
                path: "/user/refresh_token",
            });

            // Send the response (optionally include user info)
            res.json({
                accesstoken,
                user: { id: user._id, email: user.email }
            });
        } catch (err) {
            return res.status(500).json({ msg: "Something went wrong during login." });
        }
    },
    logout: async (req, res) => {
        try {
            res.clearCookie("refreshtoken", {
                path: "/user/refresh_token",
            });
            return res.json({ msg: "Logged out successfully" });
        } catch (err) {
            return res.status(500).json({ msg: "Something went wrong during logout" });
        }
    },
}
const createAccessToken = (user) =>
    jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });

const createRefreshToken = (user) =>
    jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

module.exports = userctrl;
