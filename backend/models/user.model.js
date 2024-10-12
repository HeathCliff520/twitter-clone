import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
		},
		fullName: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
			minLength: 6,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		//follers是一个数组，数组的每个元素类型由{……}规定
		followers: [
			{
				//订阅者必须是mongodb的对象类型，这是 MongoDB 中用来唯一标识每个文档的 ID 类型。
				type: mongoose.Schema.Types.ObjectId,
				//订阅者必须是User的Id，表示这些 ObjectId 引用的是User集合中的文档，即followers数组中的每个元素都是User集合中的某个用户的ID
				ref: "User",
				//默认followers是空数组
				default: [],
			},
		],
		following: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				default: [],
			},
		],
		profileImg: {
			type: String,
			default: "",
		},
		coverImg: {
			type: String, 
			default: "",
		},
		bio: {
			type: String,
			default: "",
		},

		link: {
			type: String,
			default: "",
		},
		likedPosts: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Post",
				default: [],
			},
		],
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);//user文档集合名为User

export default User;
