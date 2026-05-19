import { Response } from 'express';
import { loginUser, logoutUser } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const { user, token } = await loginUser(email, password);

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        bio: user.bio ?? null,
        avatarUrl: user.avatarUrl,
        avatar: user.avatarUrl,
        isOnline: true,
      },
      token,
    });
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      res.status(401).json({ message: 'Invalid email or password.' });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await logoutUser(req.userId!);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
