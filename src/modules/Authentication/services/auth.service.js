import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";
import Student from "../models/student.model.js";
import CompSupervisor from "../models/compSupervisor.model.js";
import UniSupervisor from "../models/uniSupervisor.model.js";
import { JWT_SECRET } from "../../../shared/config/index.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { generateVerificationToken } from "../utils/generateToken.js";

// ── Pattern Observer (Membre 5) : suppression du couplage direct email ──
import EventBus from "../../../events/EventBus.js";
// ────────────────────────────────────────────────────────────────────────

export const registerStudent = async (userData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      fullName,
      email,
      phoneNumber,
      password,
      cin,
      studentIdCardIMG,
      companyName,
      degree,
      degreeType,
      uniSupervisorId,
      compSupervisorId,
    } = userData;

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      const error = new Error(
        "User already exists with this email or phone number",
      );
      error.status = 409;
      throw error;
    }

    const existingStudent = await Student.findOne({ cin });
    if (existingStudent) {
      const error = new Error("Student with this CIN already exists");
      error.status = 409;
      throw error;
    }

    const existingUniSupervisor = await User.findById(uniSupervisorId);
    if (!existingUniSupervisor) {
      const error = new Error("University supervisor does not exist");
      error.status = 404;
      throw error;
    }
    if (existingUniSupervisor.role !== "UniSupervisor") {
      const error = new Error("Invalid university supervisor");
      error.status = 400;
      throw error;
    }
    if (!existingUniSupervisor.isVerified) {
      const error = new Error("University supervisor must be verified");
      error.status = 400;
      throw error;
    }

    const existingCompSupervisorUser = await User.findById(compSupervisorId);
    if (!existingCompSupervisorUser) {
      const error = new Error("Company supervisor does not exist");
      error.status = 404;
      throw error;
    }
    if (existingCompSupervisorUser.role !== "CompSupervisor") {
      const error = new Error("Invalid company supervisor");
      error.status = 400;
      throw error;
    }
    if (!existingCompSupervisorUser.isVerified) {
      const error = new Error("Company supervisor must be verified");
      error.status = 400;
      throw error;
    }

    const existingCompSupervisor = await CompSupervisor.findOne({
      userId: compSupervisorId,
    });
    if (!existingCompSupervisor) {
      const error = new Error("Company supervisor profile not found");
      error.status = 404;
      throw error;
    }

    const normalize = (s) =>
      String(s || "")
        .trim()
        .toLowerCase();
    if (
      normalize(existingCompSupervisor.companyName) !== normalize(companyName)
    ) {
      const error = new Error(
        "Company supervisor and student must belong to the same company",
      );
      error.status = 400;
      throw error;
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = generateVerificationToken();

    const newUser = new User({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: "Student",
      verificationToken,
      isVerified: false,
    });

    const savedUser = await newUser.save({ session });

    const newStudent = new Student({
      cin,
      studentIdCardIMG,
      companyName,
      degree,
      degreeType,
      userId: savedUser._id,
      uniSupervisorId,
      compSupervisorId,
    });

    await newStudent.save({ session });

    await UniSupervisor.findOneAndUpdate(
      { userId: uniSupervisorId },
      { $push: { studentsId: newStudent._id } },
      { session, new: true },
    );

    await CompSupervisor.findOneAndUpdate(
      { userId: compSupervisorId },
      { $push: { studentsId: newStudent._id } },
      { session, new: true },
    );

    await session.commitTransaction();
    session.endSession();

    // ── Observer : publish au lieu d'appel direct email ──
    try {
      await EventBus.publish("USER_REGISTERED", { user: savedUser });
      console.log(`✅ Verification email sent to ${savedUser.email}`);
    } catch (emailError) {
      console.error(`⚠️ Email error: ${emailError.message}`);
    }

    return {
      success: true,
      message:
        "Student registered successfully. Please check your email to verify your account.",
      data: {
        userId: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const registerCompanySupervisor = async (userData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { fullName, email, phoneNumber, password, companyName, badgeIMG } =
      userData;

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingUser) {
      const error = new Error(
        "User already exists with this email or phone number",
      );
      error.status = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = generateVerificationToken();

    const newUser = new User({
      fullName,
      phoneNumber,
      email,
      password: hashedPassword,
      role: "CompSupervisor",
      verificationToken,
      isVerified: false,
    });

    const savedUser = await newUser.save({ session });

    const newCompSupervisor = new CompSupervisor({
      companyName,
      badgeIMG,
      userId: savedUser._id,
    });

    await newCompSupervisor.save({ session });
    await session.commitTransaction();
    session.endSession();

    // ── Observer : publish au lieu d'appel direct email ──
    try {
      await EventBus.publish("USER_REGISTERED", { user: savedUser });
      console.log(`✅ Verification email sent to ${savedUser.email}`);
    } catch (emailError) {
      console.error(`⚠️ Email error: ${emailError.message}`);
    }

    return {
      success: true,
      message:
        "Company supervisor registered successfully. Please check your email to verify your account.",
      data: {
        userId: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const registerUniversitySupervisor = async (userData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { fullName, email, phoneNumber, password, badgeIMG } = userData;

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingUser) {
      const error = new Error(
        "User already exists with this email or phone number",
      );
      error.status = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = generateVerificationToken();

    const newUser = new User({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: "UniSupervisor",
      verificationToken,
      isVerified: false,
    });

    const savedUser = await newUser.save({ session });

    const newUniSupervisor = new UniSupervisor({
      badgeIMG,
      userId: savedUser._id,
    });

    await newUniSupervisor.save({ session });
    await session.commitTransaction();
    session.endSession();

    // ── Observer : publish au lieu d'appel direct email ──
    try {
      await EventBus.publish("USER_REGISTERED", { user: savedUser });
      console.log(`✅ Verification email sent to ${savedUser.email}`);
    } catch (emailError) {
      console.error(`⚠️ Email error: ${emailError.message}`);
    }

    return {
      success: true,
      message:
        "University supervisor registered successfully. Please check your email to verify your account.",
      data: {
        userId: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const verifyEmail = async (token) => {
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    const error = new Error("Invalid verification token");
    error.status = 400;
    throw error;
  }
  user.isVerified = true;
  user.verificationToken = null;
  await user.save();
  return {
    success: true,
    message: "Email verified successfully! Welcome aboard!",
  };
};

export const login = async (loginData) => {
  const { email, password } = loginData;

  const user = await User.findOne({ email, isActive: true }).select(
    "+password",
  );
  if (!user) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  if (!user.isVerified) {
    // ── Observer : publish au lieu d'appel direct ──
    try {
      await EventBus.publish("EMAIL_VERIFICATION_REQUESTED", { user });
      console.log(`✅ Verification email auto-resent to ${user.email}`);
    } catch (emailError) {
      console.error(`⚠️ Email error: ${emailError.message}`);
    }

    const error = new Error(
      "Please verify your email before logging in. A new verification email has been sent to your inbox.",
    );
    error.status = 403;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const accessToken = signAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  let userProfile = null;
  switch (user.role) {
    case "Student":
      userProfile = await Student.findOne({ userId: user._id });
      break;
    case "CompSupervisor":
      userProfile = await CompSupervisor.findOne({ userId: user._id });
      break;
    case "UniSupervisor":
      userProfile = await UniSupervisor.findOne({ userId: user._id });
      break;
  }

  return {
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified,
        profile: userProfile,
      },
      accessToken,
      refreshToken,
    },
  };
};

export const resendVerificationEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("User not found with this email");
    error.status = 404;
    throw error;
  }
  if (user.isVerified) {
    const error = new Error("Email is already verified");
    error.status = 400;
    throw error;
  }

  if (!user.verificationToken) {
    user.verificationToken = generateVerificationToken();
    await user.save();
  }

  // ── Observer : publish au lieu d'appel direct email ──
  try {
    await EventBus.publish("EMAIL_VERIFICATION_REQUESTED", { user });
    console.log(`✅ Verification email resent to ${user.email}`);
    return {
      success: true,
      message: "Verification email sent successfully. Please check your inbox.",
    };
  } catch (emailError) {
    console.error(
      `❌ Failed to resend verification email: ${emailError.message}`,
    );
    const error = new Error(
      "Failed to send verification email. Please try again later.",
    );
    error.status = 500;
    throw error;
  }
};

export const logout = async (userId) => {
  return {
    success: true,
    message: `${userId} Logged out successfully`,
  };
};

export const refreshAccessToken = async (refreshToken) => {
  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      const error = new Error("User not found or inactive");
      error.status = 401;
      throw error;
    }
    const newAccessToken = signAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });
    return {
      success: true,
      message: "Token refreshed successfully",
      data: { accessToken: newAccessToken },
    };
  } catch {
    const err = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }
};

export const requestPasswordReset = async (email) => {
  const genericResponse = {
    success: true,
    message: "If the email exists, a password reset link has been sent",
  };

  const user = await User.findOne({ email, isActive: true });
  if (!user) return genericResponse;

  const resetToken = generateVerificationToken();
  const resetTokenExpiry = Date.now() + 30 * 60 * 1000;
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(resetTokenExpiry);
  await user.save();

  // ── Observer : publish au lieu d'appel direct email ──
  try {
    await EventBus.publish("PASSWORD_RESET_REQUESTED", { user, resetToken });
    console.log(`✅ Password reset email sent to ${user.email}`);
  } catch (emailError) {
    console.error(`⚠️ Email error: ${emailError.message}`);
  }

  return process.env.NODE_ENV === "development"
    ? { ...genericResponse, resetToken }
    : genericResponse;
};

export const resetPassword = async (resetToken, newPassword) => {
  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetExpires: { $gt: new Date() },
    isActive: true,
  }).select("+password");

  if (!user) {
    const error = new Error("Invalid or expired password reset token");
    error.status = 400;
    throw error;
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return {
    success: true,
    message: "Password reset successfully",
  };
};
