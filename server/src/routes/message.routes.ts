import { Router } from 'express';
import { getMessages, markAsRead, getGroupMessagesController, deleteMessageController, searchController } from '../controllers/message.controller';

const router = Router();

router.get('/search', searchController);
router.get('/group/:groupId', getGroupMessagesController);
router.get('/:senderId/:receiverId', getMessages);
router.post('/mark-read', markAsRead);
router.delete('/:messageId', deleteMessageController);

export default router;
