import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getProfile, updateProfile, changePassword } from '../services/profile.service';
import { getIO } from '../lib/io';

export const handleGetProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await getProfile(req.userId!);
    res.json(profile);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const handleUpdateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, bio, avatarUrl } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }
  try {
    const user = await updateProfile(req.userId!, { name, bio, avatarUrl });
    res.json(user);
    // Broadcast to all connected clients so every contact list updates in real-time
    getIO()?.emit('user_profile_updated', {
      userId: req.userId!,
      name,
      bio: bio ?? null,
      avatarUrl: avatarUrl ?? null,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const handleChangePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Both passwords are required' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ message: 'New password must be at least 6 characters' });
    return;
  }
  try {
    await changePassword(req.userId!, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
