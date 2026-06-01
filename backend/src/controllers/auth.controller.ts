import { Response, NextFunction } from "express";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import NotificationService from "../services/notification.service.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const signup = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return next(new AppError("All fields are required", 400));
  }

  if (password.length < 6) {
    return next(new AppError("Password must be at least 6 characters", 400));
  }

  const user = await User.findOne({ email });

  if (user) return next(new AppError("Email already exists", 400));

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    fullName,
    email,
    password: hashedPassword,
  });

  if (newUser) {
    const token = generateToken(newUser._id, res);
    await newUser.save();

    NotificationService.sendWelcomeNotification(newUser._id);

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
      notificationPreferences: newUser.notificationPreferences,
      token: token,
    });
  } else {
    return next(new AppError("Invalid user data", 400));
  }
});


export const login = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("Invalid credentials", 400));
  }
  if (!user.password) {
    return next(new AppError("Invalid credentials", 400));
  }

  const isPasswordCorrect = await bcrypt.compare(password || "", user.password);
  if (!isPasswordCorrect) {
    return next(new AppError("Invalid credentials", 400));
  }

  const token = generateToken(user._id, res);

  res.status(200).json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
    notificationPreferences: user.notificationPreferences,
    token: token,
  });
});


export const logout = (req: AuthRequest, res: Response) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};

export const getUserByUsername = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { username } = req.params;
  const requesterId = req.user?._id;
  const user = await User.findOne({ username })
    .select('-password -email')
    .lean();
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  // If privateProfile exists, check visibility
  if (user.privateProfile && user.allowedViewers && requesterId) {
    const isAllowed = user.allowedViewers.some((id: any) => id.equals(requesterId));
    if (!isAllowed) {
      // hide private data
      delete user.privateProfile;
    }
  }
  res.status(200).json(user);
});

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const allowedUpdates = ['username', 'handle', 'publicProfile', 'privateProfile', 'profilePic'];
  const updates = req.body;
  const updateData: any = {};
  
  // Filter allowed fields
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      updateData[key] = updates[key];
    }
  }

  // Handle profilePic upload to Cloudinary
  if (updateData.profilePic) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(updateData.profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return next(new AppError("Failed to upload image", 500));
    }
  }

  // Ensure uniqueness for username and handle if provided
  if (updateData.username) {
    const existing = await User.findOne({ username: updateData.username, _id: { $ne: req.user!._id } });
    if (existing) return next(new AppError('Username already taken', 400));
  }
  if (updateData.handle) {
    const existing = await User.findOne({ handle: updateData.handle, _id: { $ne: req.user!._id } });
    if (existing) return next(new AppError('Handle already taken', 400));
  }

  const updatedUser = await User.findByIdAndUpdate(req.user!._id, updateData, { new: true, runValidators: true })
    .select('-password');
  res.status(200).json(updatedUser);
});

export const checkAuth = (req: AuthRequest, res: Response) => {
  res.status(200).json(req.user);
};


