const jsonwebtoken = require("jsonwebtoken");

module.exports = function validateToken(req, res, next) {
    const token = req.header('x-auth-token');
    if(!token) return res.status(401).send(`Access denied. no Token found`);
    try{
        const decoded = jsonwebtoken.verify(token, "PrivateKey");
        req.receptionist = decoded;
        next();
    }catch(error) {
        res.status(400).send(`Invalid token`);
    }
}
