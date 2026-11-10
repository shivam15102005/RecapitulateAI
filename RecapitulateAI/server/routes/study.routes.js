import { Router } from 'express';
import { createStudyPack } from '../controllers/study.controller.js';
import { validateBody } from '../middleware/validateBody.js';
import { studyRequestSchema } from '../schemas/studyRequest.schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.post('/', validateBody(studyRequestSchema), asyncHandler(createStudyPack));

export default router;
