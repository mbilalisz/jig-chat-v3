import { Router } from 'express';
import {
  createGroup,
  getUserGroups,
  getGroup,
  updateGroup,
  addMember,
  removeMember,
  toggleGroupFavorite,
} from '../services/group.service';
import { saveGroupMessage } from '../services/message.service';
import { getIO } from '../lib/io';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy, memberIds } = req.body;
    if (!name || !createdBy) {
      return res.status(400).json({ message: 'name and createdBy are required' });
    }
    const group = await createGroup(name, description, createdBy, memberIds || []);
    res.status(201).json(group);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    const groups = await getUserGroups(userId as string);
    res.json(groups);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:groupId', async (req, res) => {
  try {
    const group = await getGroup(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/:groupId', async (req, res) => {
  try {
    const { requesterId, name, description } = req.body;
    const group = await updateGroup(req.params.groupId, requesterId, { name, description });
    res.json(group);
  } catch (e: any) {
    res.status(e.message === 'Unauthorized' ? 403 : 500).json({ message: e.message });
  }
});

router.post('/:groupId/members', async (req, res) => {
  try {
    const { requesterId, userId } = req.body;
    const { groupId } = req.params;

    const newMember = await addMember(groupId, requesterId, userId);

    const [requester, fullGroup] = await Promise.all([
      prisma.user.findUnique({ where: { id: requesterId }, select: { name: true } }),
      getGroup(groupId),
    ]);

    const systemMsg = await saveGroupMessage({
      senderId: requesterId,
      groupId,
      content: `${requester!.name} added ${newMember.user.name}`,
      type: 'system',
    });

    const io = getIO();
    // Notify the new member so the group appears in their sidebar immediately
    io?.to(userId).emit('member_added', { group: fullGroup, systemMessage: systemMsg });
    // Broadcast the system message to all existing group room members
    io?.to(`group:${groupId}`).emit('receive_group_message', systemMsg);

    res.status(201).json(newMember);
  } catch (e: any) {
    res.status(e.message === 'Unauthorized' ? 403 : 500).json({ message: e.message });
  }
});

router.post('/favorite', async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    if (!userId || !groupId) return res.status(400).json({ message: 'userId and groupId are required' });
    const result = await toggleGroupFavorite(userId, groupId);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:groupId/members/:userId', async (req, res) => {
  try {
    const requesterId = req.query.requesterId as string;
    if (!requesterId) return res.status(400).json({ message: 'requesterId is required' });
    const { groupId, userId } = req.params;

    await removeMember(groupId, requesterId, userId);

    const [requester, removedUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: requesterId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);

    const systemMsg = await saveGroupMessage({
      senderId: requesterId,
      groupId,
      content: `${requester!.name} removed ${removedUser!.name}`,
      type: 'system',
    });

    const io = getIO();
    // Tell only the removed user to drop the group from their sidebar
    io?.to(userId).emit('member_removed', { groupId, userId });
    // Tell all remaining group members to update their local member list
    io?.to(`group:${groupId}`).emit('group_member_removed', { groupId, userId });
    // Broadcast the system message to the group room
    io?.to(`group:${groupId}`).emit('receive_group_message', systemMsg);

    res.json({ message: 'Member removed' });
  } catch (e: any) {
    const status = e.message === 'Unauthorized' || e.message === 'Not a member' ? 403 : 500;
    res.status(status).json({ message: e.message });
  }
});

export default router;
