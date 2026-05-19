import { Request, Response } from 'express';
import { getUserSettings, updateUserSettings } from '../services/settings.service';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId as string;

  try {
    const settings = await getUserSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId as string;
  const data = req.body;

  try {
    const settings = await updateUserSettings(userId, data);
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
