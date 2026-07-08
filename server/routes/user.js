import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/user.js';
import Vehicle from '../model/vehicle.js';
import userAuth from '../controller/userAuth.js';
import Upload from '../multer.js';

const router = express.Router();

// 1. POST: Signup
router.post('/api/signup', async (req, res) => {
    const { name, email, idNumber, password, type } = req.body;

    try {
        if (!name || !email || !idNumber || !password || !type) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existing = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { idNumber: idNumber.trim() }],
        });
        if (existing) {
            return res.status(409).json({
                message: existing.idNumber === idNumber.trim()
                    ? 'An account with this matriculation/staff ID already exists'
                    : 'An account with this email already exists',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            idNumber: idNumber.trim(),
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
            user: { id: newUser._id, name: newUser.name, email: newUser.email, idNumber: newUser.idNumber, type: newUser.type, role: newUser.type },
        });

    } catch (error) {
        console.log('signup error:', error);
        res.status(500).json({ message: 'Signup failed' });
    }
});


// 2. POST: Login
router.post('/api/login', async (req, res) => {
    const { idNumber, password } = req.body;

    try {
        if (!idNumber || !password) {
            return res.status(400).json({ message: 'Matriculation/Staff ID and password are required' });
        }

        const user = await User.findOne({ idNumber: idNumber.trim() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid ID or password' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid ID or password' });
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
            user: { id: user._id, name: user.name, email: user.email, idNumber: user.idNumber, type: user.type, role: user.type },
        });

    } catch (error) {
        console.log('login error:', error);
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
            .select('name email idNumber type photoUrl')
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


// PATCH: Upload/replace profile photo — matches ProfilePage's clickable avatar
router.patch('/api/profile/photo', userAuth, Upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file received' });
    }

  
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Profile picture must be an image' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

   
    user.photoUrl = req.file.path;
    await user.save();

    res.status(200).json({ photoUrl: user.photoUrl });

  } catch (error) {
    console.error('photo upload error:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
});




export default router; 
