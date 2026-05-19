import { Router } from 'express';
import { handleGetProfile, handleUpdateProfile, handleChangePassword } from '../controllers/profile.controller';

const router = Router();

router.get('/', handleGetProfile);
router.put('/', handleUpdateProfile);
router.put('/password', handleChangePassword);

export default router;
