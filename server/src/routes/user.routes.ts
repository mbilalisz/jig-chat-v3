import { Router } from 'express';
import { getUsers, handleGetUserById, handleToggleFavorite, handleHideContact } from '../controllers/user.controller';

const router = Router();

router.get('/', getUsers);
router.post('/favorite', handleToggleFavorite);
router.post('/hide', handleHideContact);
router.get('/:id', handleGetUserById);

export default router;
