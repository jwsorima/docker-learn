import { Request, Response, Router } from "express";
import { Applicant, checkEmailExists, createApplicant, getApplicant, getApplicantsPaged, loginApplicant } from "../db/applicantsQueries.js";
const applicants = Router();
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { verifyApplicantJwt } from "../middlewares/verifyJwt.js";
import { AuthPayload, generateAccessToken, generateRefreshToken } from "../helpers/authHelper.js";

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'secret143';

const argon2Options = {
  type: argon2.argon2id, // Use Argon2id for better security
  memoryCost: 65536,     // Memory cost in KiB (64 MB)
  timeCost: 3,           // Number of iterations
  parallelism: 1         // Number of parallel threads (set this to your server's capabilities)
};

applicants.post('/', async (req: Request, res: Response) => {
  let applicant: Applicant = req.body;

  try {
    const emailResult = await checkEmailExists(applicant.email)
    
    if (emailResult.rows.length > 0) {
      res.status(400).json({ message: 'An account with this email already exists.' }); return;
    }

    const hashedPassword = await argon2.hash(applicant.password, argon2Options);
    applicant.password = hashedPassword;

    await createApplicant(applicant);

    res.status(201).json({ message: 'Account created successfully' });

  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

applicants.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const applicant = await loginApplicant(email, password);

    if (!applicant) {
      res.status(401).json({ message: 'Invalid email or password', login: false });
      return;
    }

    const applicantPayload: AuthPayload = {
      id: applicant.applicant_id,
      email: applicant.email,
      role: 'applicant',
    };

    const accessToken = generateAccessToken(applicantPayload);
    const refreshToken = generateRefreshToken(applicantPayload);

    // Store the refresh token in an HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use true in production
      sameSite: 'strict', // Adjust based on CSRF protection strategy
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    res.status(200).json({
      message: 'Login successful',
      login: true,
      accessToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

applicants.post('/logout', (_req: Request, res: Response) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
  });

  // Optionally, you can also invalidate the refresh token in your database or token store here

  res.status(200).json({ message: 'Logged out successfully' });
});

applicants.post('/refresh-token', (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    res.status(401).json({ message: 'Refresh token not found' }); return;
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'id' in decoded &&
      'email' in decoded &&
      'role' in decoded &&
      decoded.role === 'applicant'
    ) {
      const applicantData = decoded as AuthPayload;

      const newAccessToken = generateAccessToken(applicantData);

      res.status(200).json({ accessToken: newAccessToken });
    } else {
      res.status(403).json({ message: 'Invalid refresh token payload' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

applicants.get('/auth-status', verifyApplicantJwt, (req: Request, res: Response) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

applicants.get('/:id', verifyApplicantJwt, async (req: Request, res: Response) => {
  const applicantID = req.params.id;

  try {
    const user = req.user;
    if (user && user.id !== parseInt(applicantID, 10)) {
      res.status(403).json({ message: 'Access denied' }); return;
    }

    const getResponse = await getApplicant(parseInt(applicantID, 10));

    if (getResponse.rows.length === 0) {
      res.status(404).json({ message: 'Applicant not found' }); return;
    }

    let applicant = getResponse.rows[0];

    res.status(200).json(applicant);
  } catch (error) {
    if (error instanceof Error) {
      console.log('Login error:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred during login:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

applicants.get('/', async (req: Request, res: Response) => {
  const page = Math.max(0, parseInt(req.query.page as string, 10) || 0);
  const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
  const offset = page * limit;

  try {
    const { applicants, total } = await getApplicantsPaged(limit, offset);

    res.status(200).json({
      applicants: applicants,
      total
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log('Login error:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred during login:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

export default applicants;