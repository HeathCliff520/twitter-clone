import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

//注册操作
export const signup = async (req, res) => {
	try {
		//req.body 是请求的主体数据。通常用于处理客户端发送的 POST 或 PUT 请求中的数据，
		//比如通过表单提交或 JSON 数据。要解析请求的主体数据，你通常会使用中间件，例如 body-parser 或 Express 的内置 express.json()。
		//这些字段是从请求中发送的
		const { fullName, username, email, password } = req.body;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			//未通过邮件格式校验处理
			return res.status(400).json({ error: "Invalid email format" });
		}

		const existingUser = await User.findOne({ username });
		if (existingUser) {
			//用户存在的情况
			return res.status(400).json({ error: "Username is already taken" });
		}

		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			//邮件存在的情况
			return res.status(400).json({ error: "Email is already taken" });
		}

		if (password.length < 6) {
			//密码字符短于6
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);//密码hash化
		//这是一个传参的动作，password被hashedPassword赋值了，其他参数因为和模型字段一致，所以会被一一赋值，字段类型可以省略
		const newUser = new User({
			//字段与模型中的字段一致，可以省略类型
			fullName,
			username,
			email,
			password: hashedPassword,
		});

		if (newUser) {
			//用户创建成功，产生cook，用户不需要退出再重新登录以获得cookies
			generateTokenAndSetCookie(newUser._id, res);
			//用户入库
			await newUser.save();//mongooes中的方法
			//返回该用户所有信息
			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				email: newUser.email,
				followers: newUser.followers,
				following: newUser.following,
				profileImg: newUser.profileImg,
				coverImg: newUser.coverImg,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		//用于错误定位
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		//const hashedPassword = await bcrypt.hash(password, salt);//密码hash化
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}
		//生成cookies不必再登录
		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			email: user.email,
			followers: user.followers,
			following: user.following,
			profileImg: user.profileImg,
			coverImg: user.coverImg,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logout = async (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });//maxage为0表示立即生效
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getMe controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
