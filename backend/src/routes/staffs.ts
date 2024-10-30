import { Request, Response, Router } from "express";
import { createStaff, deleteStaff, getDashboardStats, getStaffsPaged, loginStaff, Staff, updateStaff } from "../db/staffsQueries.js";
const staffs = Router();
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { AuthPayload, generateAccessToken, generateRefreshToken } from "../helpers/authHelper.js";
import { verifyStaffJwt } from "../middlewares/verifyJwt.js";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'secret143';

const argon2Options = {
  type: argon2.argon2id, // Use Argon2id for better security
  memoryCost: 65536,     // Memory cost in KiB (64 MB)
  timeCost: 3,           // Number of iterations
  parallelism: 1         // Number of parallel threads (set this to your server's capabilities)
};

type RoleType = 'staff' | 'super_admin';

staffs.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(0, parseInt(req.query.page as string, 10) || 0);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
    const offset = page * limit;

    const { staffs, total } = await getStaffsPaged(limit, offset);
    res.status(200).json({ staffs, total });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching admissions:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.error('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

staffs.post('/', async (req: Request, res: Response) => {
  let staff: Staff = req.body;

  try {
    const hashedPassword = await argon2.hash(staff.password, argon2Options);
    staff.password = hashedPassword;

    await createStaff(staff);

    res.status(201).json({ message: 'Staff account created successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

staffs.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let staff: Staff = req.body;
    staff.staff_id = id;

    if (staff.password && staff.password.trim() !== "") {
      const hashedPassword = await argon2.hash(staff.password, argon2Options);
      staff.password = hashedPassword;
    } else {
      staff.password = "";
    }

    await updateStaff(staff);

    res.status(201).json({ message: 'Staff account updated successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

staffs.delete('/:id', async (req: Request, res: Response) => {
  const staffID = parseInt(req.params.id, 10);

  if (isNaN(staffID)) {
    res.status(400).json({ message: 'Invalid staff ID' });
    return;
  }

  try {
    await deleteStaff(staffID);

    res.status(200).json({ message: 'Staff deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting staff:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

staffs.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching dashboard stats:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

staffs.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const staff = await loginStaff(email, password);

    if (!staff) {
      res.status(401).json({ message: 'Invalid email or password', login: false }); return;
    }

    const isValidRole = (role: string | undefined): role is RoleType =>
      role === 'staff' || role === 'super_admin';

    if (!isValidRole(staff.role)) {
      res.status(401).json({ message: 'Unauthorized role', login: false });
      return;
    }

    const staffPayload: AuthPayload = {
      id: staff.staff_id,
      email: staff.email,
      role: staff.role,
    };

    const accessToken = generateAccessToken(staffPayload);
    const refreshToken = generateRefreshToken(staffPayload);

    res.cookie('refreshTokenA', refreshToken, {
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
    console.error('Error during staff login:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

staffs.post('/refresh-token', (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    res.status(401).json({ message: 'Refresh token not found' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'id' in decoded &&
      'email' in decoded &&
      'role' in decoded &&
      (decoded.role === 'staff' || decoded.role === 'super_admin')
    ) {
      const staffData = decoded as AuthPayload;

      const newAccessToken = generateAccessToken(staffData);

      res.status(200).json({ accessToken: newAccessToken });
    } else {
      res.status(403).json({ message: 'Invalid refresh token payload' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

staffs.get('/auth-status', verifyStaffJwt, (req: Request, res: Response) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

staffs.post('/logout', (_req: Request, res: Response) => {
  res.cookie('refreshTokenA', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
  });

  res.status(200).json({ message: 'Logged out successfully' });
});

export default staffs;