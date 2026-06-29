import jwt from 'jsonwebtoken'

async function userAuth(req, res, next) {

    const authHeader = req.headers.authorization
    const userToken = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.cookies.userToken

    if (!userToken) return res.status(402).json({ authenticated: false })

    try {
        const decoded = jwt.verify(userToken, process.env.USER_JWT_SECRET)
        req.user = decoded
        next()

    } catch (error) {
        res.status(500).json({ authenticated: false, message: 'invalid token' })
    }
}

export default userAuth

