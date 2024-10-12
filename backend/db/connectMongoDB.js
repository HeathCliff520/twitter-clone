import mongoose from "mongoose";
//这里未导入dotenv是应为它会被server.js调用，所以不用导入

//链接数据库函数，以被调，是一个工具函数
const connectMongoDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI);//返回连接信息
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`Error connection to mongoDB: ${error.message}`);
		process.exit(1);
	}
};

export default connectMongoDB;
