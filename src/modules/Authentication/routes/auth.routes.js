import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../../shared/middlewares/validate.js";
import { authenticateToken } from "../../../shared/middlewares/auth.middleware.js";
import {
  studentSignupSchema,
  companySupervisorSignupSchema,
  universitySupervisorSignupSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema
} from "../validators/auth.validator.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

// Rate limiting configurations
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: { message: "Too many signup attempts from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { message: "Too many login attempts from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  message: { message: "Too many verification attempts from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  //change it to now stop me from testing
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: { message: "Too many password reset attempts from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/signup/student", signupLimiter, validate(studentSignupSchema), authController.signupStudent);
/**
 * @swagger
 * /auth/signup/student:
 *   post:
 *     summary: Register a new student
 *     description: Creates a new Student account. Sends an email verification link.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentSignupRequest'
 *     responses:
 *       201:
 *         description: Student registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Student registered successfully. Please check your email to verify your account.
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     role:
 *                       type: string
 *                       example: Student
 *                     signupToken:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: User or student already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/signup/supervisor-company", signupLimiter, validate(companySupervisorSignupSchema), authController.signupCompanySupervisor);
/**
 * @swagger
 * /auth/signup/supervisor-company:
 *   post:
 *     summary: Register a new company supervisor
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanySupervisorSignupRequest'
 *     responses:
 *       201:
 *         description: Company supervisor registered
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: User already exists
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/signup/supervisor-university", signupLimiter, validate(universitySupervisorSignupSchema), authController.signupUniversitySupervisor);
/**
 * @swagger
 * /auth/signup/supervisor-university:
 *   post:
 *     summary: Register a new university supervisor
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UniversitySupervisorSignupRequest'
 *     responses:
 *       201:
 *         description: University supervisor registered
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: User already exists
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/verify-email", verificationLimiter, authController.verifyEmail);
/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify email address
 *     description: Verify a user email using the verification token.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Verification token received via email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid verification token
 */
router.post("/login", loginLimiter, validate(loginSchema), authController.login);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful (refresh token set as HTTP-only cookie)
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: HTTP-only cookie containing refreshToken
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 */
router.post("/refresh-token", authController.refreshToken);
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: Invalid or missing refresh token cookie
 */
router.post("/request-password-reset", passwordResetLimiter, validate(passwordResetRequestSchema), authController.requestPasswordReset);
/**
 * @swagger
 * /auth/request-password-reset:
 *   post:
 *     summary: Request a password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Generic message (no disclosure)
 */
router.post("/reset-password", passwordResetLimiter, validate(passwordResetSchema), authController.resetPassword);
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordReset'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired password reset token
 */

router.post("/logout", authenticateToken, authController.logout);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully (refresh cookie cleared)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export default router;