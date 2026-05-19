import { Request, Response } from 'express';
import { getAllUsersWithStatus, getUserById, toggleFavorite, hideContact } from '../services/user.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const handleGetUserById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const user = await getUserById(id as string);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json(user);
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.query.currentUserId as string;
  const filter = req.query.filter as string; // 'All messages', 'Unread', 'Favorites'
  
  try {
    const usersWithStatus = await getAllUsersWithStatus(currentUserId, filter);
    res.json(usersWithStatus);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const handleHideContact = async (req: AuthRequest, res: Response): Promise<void> => {
  const hiderId = req.userId!;
  const { hiddenId } = req.body;
  if (!hiddenId) { res.status(400).json({ message: 'hiddenId is required' }); return; }
  try {
    await hideContact(hiderId, hiddenId);
    res.json({ message: 'Contact hidden' });
  } catch (error) {
    console.error('Hide contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const handleToggleFavorite = async (req: Request, res: Response): Promise<void> => {
  const { userId, favoriteId } = req.body;
  
  if (!userId || !favoriteId) {
    res.status(400).json({ message: 'User ID and Favorite ID are required' });
    return;
  }

  try {
    const result = await toggleFavorite(userId, favoriteId);
    res.json(result);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
