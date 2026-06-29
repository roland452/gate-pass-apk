import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/user.js';
import Vehicle from '../model/vehicle.js';
import userAuth from '../controller/userAuth.js';

const router = express.Router();

// 1. POST: Signup
router.post('/api/signup', async (req, res) => {
    const { name, email, password, type } = req.body;

    try {
        if (!name || !email || !password || !type) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            type,
        });

        await newUser.save();

        // ← include type in JWT so admin checks work
        const token = jwt.sign(
            { userId: newUser._id, role: newUser.type },
            process.env.USER_JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('userToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            authenticated: true,
            token, // ← return token in body for mobile app
            user: { id: newUser._id, name: newUser.name, email: newUser.email, type: newUser.type, role: newUser.type },
        });

    } catch (error) {
        console.error('signup error:', error);
        res.status(500).json({ message: 'Signup failed' });
    }
});


// 2. POST: Login
router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // ← include type in JWT so admin checks work
        const token = jwt.sign(
            { userId: user._id, role: user.type },
            process.env.USER_JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('userToken', token, {
            httpOnly: true,
            secure:true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            authenticated: true,
            token, // ← return token in body for mobile app
            user: { id: user._id, name: user.name, email: user.email, type: user.type, role: user.type },
        });

    } catch (error) {
        console.error('login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});


// 3. POST: Logout
router.post('/api/logout', (req, res) => {
    res.clearCookie('userToken');
    res.status(200).json({ message: 'Logged out' });
});


// 4. GET: Profile
router.get('/api/profile', userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('name email type photoUrl')
            .lean();

        if (!user) return res.status(404).json({ message: 'User not found' });

        const approvedVehicleCount = await Vehicle.countDocuments({
            owner: req.user.userId,
            status: 'approved',
        });

        res.status(200).json({ ...user, approvedVehicleCount });

    } catch (error) {
        console.error('profile fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
});


router.get('/api/user-auth', userAuth, async(req, res, next) => {
    res.json({authenticated: true})
    next() 
})

export default router;