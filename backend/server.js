import path from "path";
import express from "express"; //后端服务器
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

//注意.js后缀，不要省，否则会报错
import authRoutes from "./routes/auth.route.js"; //权限路由express.Router();
import userRoutes from "./routes/user.route.js"; //用户路由express.Router();
import postRoutes from "./routes/post.route.js"; //表单路由express.Router();
import notificationRoutes from "./routes/notification.route.js";

import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();


// app.use() 可以用来：app.use([path], callback)

// 应用全局中间件：在所有路由处理请求之前执行中间件函数。
// 定义特定路径的中间件：仅在特定路径匹配时才执行的中间件函数。
// 错误处理中间件：处理请求时的错误。
// 路由中间件：可以将多个路由组合起来管理。

//所有请求路径先执行json格式话
app.use(express.json({ limit: "5mb" })); // to parse req.body
// limit shouldn't be too high to prevent DOS
app.use(express.urlencoded({ extended: true })); // to parse form data(urlencoded)

//cookie-parser 是 Express 中常用的中间件，
//用于解析 HTTP 请求中的 Cookie，并将其封装到 
//req.cookies对象中，便于服务器处理。
//它能够帮助你轻松地访问和管理客户端传递的 Cookie 数据。
app.use(cookieParser());

// sever(后端入口文件)->router(路径)->controller(操作)->model(数据库)
app.use("/api/auth", authRoutes);//到路径/api/auth下执行authRoutes的函数
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

app.listen(PORT, () => {
	//这里端口是动态的，所以要用``将整句话包裹起来
	console.log(`Server is running on port ${PORT}`);
	connectMongoDB();
});
