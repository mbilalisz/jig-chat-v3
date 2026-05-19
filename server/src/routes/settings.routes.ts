import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';

const router = Router();

router.get('/:userId', getSettings);
router.patch('/:userId', updateSettings);

export default router;
