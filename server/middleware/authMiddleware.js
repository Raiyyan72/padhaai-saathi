const jwt = require("jsonwebtoken");


const authMiddleware = (req, res, next) => {

  try {

    // Get token from header

    const token = req.headers.authorization?.split(" ")[1];


    if (!token) {

      return res.status(401).json({
        message: "No token, authorization denied"
      });

    }


    // Verify token

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    // Add user data in request

    req.user = decoded;


    next();


  } catch (error) {

    res.status(401).json({

      message: "Invalid Token"

    });

  }

};


module.exports = authMiddleware;