import jwt from "jsonwebtoken";

//工具类，为用户生成token并设置cookies
export const generateTokenAndSetCookie = (userId, res) => {
	//JWT_SECRET的产生:bash$ openssl rand -base64 32
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, {
		maxAge: 15 * 24 * 60 * 60 * 1000, //MS
		httpOnly: true, // prevent XSS attacks cross-site scripting attacks
		sameSite: "strict", // CSRF attacks cross-site request forgery attacks
		secure: process.env.NODE_ENV !== "development",
	});
};
