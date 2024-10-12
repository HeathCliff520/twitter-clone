import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
	try {
		//app.use(cookieParser())会把用户cook封装到req.cookies对象中
		const token = req.cookies.jwt;
		if (!token) {
			return res.status(401).json({ error: "Unauthorized: No Token Provided" });
		}
		//jwt.verify() 会返回解码后的Token中的payload(有效载荷)数据，是一个JSON 对象
		//payload(有效载荷)数据：注册声明；公开声明(userId,username,email等)；私有声明
		const decoded = jwt.verify(token, process.env.JWT_SECRET);//是一个json

		if (!decoded) {
			return res.status(401).json({ error: "Unauthorized: Invalid Token" });
		}

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		req.user = user;
		next();//跳转到下一个中间件
	} catch (err) {
		console.log("Error in protectRoute middleware", err.message);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};
