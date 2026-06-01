import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

// Now using standard Express Request, extended via types/express.d.ts
export type AuthRequest = Request;

export const protectRoute = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = req.cookies.jwt;

  if (!token && req.headers.authorization) {
    if (req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else {
      token = req.headers.authorization;
    }
  }

  if (!token) {
    return next(new AppError("Unauthorized - No Token Provided", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch (err) {
    return next(new AppError("Unauthorized - Invalid Token", 401));
  }

  if (!decoded) {
    return next(new AppError("Unauthorized - Invalid Token", 401));
  }

  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  req.user = user;
  next();
});
