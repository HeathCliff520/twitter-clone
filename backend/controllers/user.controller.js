import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

// models
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getUserProfile = async (req, res) => {
	const { username } = req.params;//从请求路径中获取动态用户名(.../:username)，此处/profile/:username

	try {
		const user = await User.findOne({ username }).select("-password");//"-password"表示过滤掉密码
		if (!user) return res.status(404).json({ message: "User not found" });

		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getUserProfile: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const followUnfollowUser = async (req, res) => {
	try {
		//.../follow/:id某一id是否被关注
		const { id } = req.params;
		const userToModify = await User.findById(id);//待验用户
		const currentUser = await User.findById(req.user._id);//本用户，me

		if (id === req.user._id.toString()) {//传入的是自己的id
			return res.status(400).json({ error: "You can't follow/unfollow yourself" });
		}

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });//未找到用户id
		//是否以关注
		const isFollowing = currentUser.following.includes(id);//following字段中是否有此id？

		//该id我正在关注
		if (isFollowing) {
			// 取消对该用户的关注,在follower字段里剔除名为req.user._id的关注者
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

			res.status(200).json({ message: "User unfollowed successfully" });
		} else {
			// Follow the user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			// Send notification to the user
			const newNotification = new Notification({
				type: "follow",
				from: req.user._id,
				to: userToModify._id,
			});

			await newNotification.save();

			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (error) {
		console.log("Error in followUnfollowUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

//仅为功能演示
export const getSuggestedUsers = async (req, res) => {
	try {
		const userId = req.user._id;

		const usersFollowedByMe = await User.findById(userId).select("following");
		
		//挑选并过滤掉不包括本用户Id的10个随机用户
		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },//id字段下 not_equeen userId
				},
			},
			{ $sample: { size: 10 } },//给出10个
		]);

		// 1,2,3,4,5,6,
		const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));//过滤掉已订阅用户
		const suggestedUsers = filteredUsers.slice(0, 4);//只挑选前四个，这里只做功能演示，具体不做完善

		suggestedUsers.forEach((user) => (user.password = null));//挑选出来的用户密码为空

		res.status(200).json(suggestedUsers);
	} catch (error) {
		console.log("Error in getSuggestedUsers: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const updateUser = async (req, res) => {
	//取字段
	const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	//当前用户Id
	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });
		//只有新密码没有旧密码或者只有旧密码没有新密码都不予通过
		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}
		/**需要第三方存储：cloudinary,已在入口文件做了配置
		 * cloudinary_cloud_name=
		 * cloudinary_api_key=
		 * cloudinary_api_secret=
		 */
		if (profileImg) {
			if (user.profileImg) {
				// https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
				/**
				 * cloudinary.uploader.destroy(fileName):
				 * 		fileName = user.profileImg.split("/").pop().split(".")[0]
				 * split("/"):将 URL 按照斜杠 / 分割成一个数组
				 * pop(): 从数组中获取最后一个部分，也就是文件名zmxorcxexpdbh8r0bkjb.png。
				 * split(".")[0]: 然后对文件名进行分割，以点 . 为分隔符
				 */
				//销毁旧头像
				await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
			}
			//上传url
			const uploadedResponse = await cloudinary.uploader.upload(profileImg);
			//uploadedResponse.secure_url 是指上传成功后的图片的完整 URL
			profileImg = uploadedResponse.secure_url;
		}

		if (coverImg) {
			if (user.coverImg) {
				await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(coverImg);
			coverImg = uploadedResponse.secure_url;
		}

		//为 user.fullName 赋值，但仅在 fullName 有效时才覆盖现有的值。具体来说，如果 fullName 为空或未定义，user.fullName 将保持原来的值。
		user.fullName = fullName || user.fullName;//a or b
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		// password should be null in response
		user.password = null;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};
