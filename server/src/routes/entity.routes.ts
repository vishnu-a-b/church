import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  getAllBavanakutayimas,
  getBavanakutayimaById,
  createBavanakutayima,
  updateBavanakutayima,
  deleteBavanakutayima,
  getAllHouses,
  getHouseById,
  createHouse,
  updateHouse,
  deleteHouse,
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  processCampaignDues,
  getAllSpiritualActivities,
  getSpiritualActivityById,
  createSpiritualActivity,
  updateSpiritualActivity,
  deleteSpiritualActivity,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  getMyTransactions,
  getMySpiritualActivities,
  createMySpiritualActivity,
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getActiveNews,
  getActiveEvents,
} from '../controllers/entityController';
import {
  getAllStothrakazhcha,
  getStothrakazhchaById,
  createStothrakazhcha,
  updateStothrakazhcha,
  deleteStothrakazhcha,
  getCurrentWeekStothrakazhcha,
  addContribution,
} from '../controllers/stothrakazhchaController';
import {
  getAllStothrakazhchaDues,
  getStothrakazhchaDueById,
  getDuesForEntity,
  processStothrakazhchaDues,
  markDueAsPaid,
  deleteStothrakazhchaDue,
} from '../controllers/stothrakazhchaDueController';
import {
  generateMemberCredentials,
  resetMemberPassword,
  getMembersWithCredentials,
  getMembersWithoutCredentials,
  bulkGenerateCredentials,
  removeMemberCredentials,
  exportCredentialsList,
} from '../controllers/memberCredentialController';
import {
  getAllChurches,
  getChurchById,
  createChurch,
  updateChurch,
  deleteChurch,
} from '../controllers/churchController';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/churches:
 *   get:
 *     summary: Get all churches
 *     tags: [Churches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all churches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Church'
 *   post:
 *     summary: Create a new church
 *     tags: [Churches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Church'
 *     responses:
 *       201:
 *         description: Church created successfully
 *
 * /api/churches/{id}:
 *   get:
 *     summary: Get church by ID
 *     tags: [Churches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Church details
 *   put:
 *     summary: Update church
 *     tags: [Churches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Church'
 *     responses:
 *       200:
 *         description: Church updated successfully
 *   delete:
 *     summary: Delete church
 *     tags: [Churches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Church deleted successfully
 */
router.route('/churches').get(getAllChurches).post(createChurch);
router.route('/churches/:id').get(getChurchById).put(updateChurch).delete(deleteChurch);

/**
 * @swagger
 * /api/units:
 *   get:
 *     summary: Get all units
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all units
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Unit'
 *
 * /api/units/{id}:
 *   get:
 *     summary: Get unit by ID
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unit details
 *   put:
 *     summary: Update unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *   delete:
 *     summary: Delete unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unit deleted successfully
 */
router.route('/units').get(getAllUnits).post(createUnit);
router.route('/units/:id').get(getUnitById).put(updateUnit).delete(deleteUnit);

/**
 * @swagger
 * /api/bavanakutayimas:
 *   get:
 *     summary: Get all bavanakutayimas
 *     tags: [Bavanakutayimas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bavanakutayimas
 *
 * /api/bavanakutayimas/{id}:
 *   get:
 *     summary: Get bavanakutayima by ID
 *     tags: [Bavanakutayimas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bavanakutayima details
 *   put:
 *     summary: Update bavanakutayima
 *     tags: [Bavanakutayimas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bavanakutayima updated successfully
 *   delete:
 *     summary: Delete bavanakutayima
 *     tags: [Bavanakutayimas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bavanakutayima deleted successfully
 */
router.route('/bavanakutayimas').get(getAllBavanakutayimas).post(createBavanakutayima);
router.route('/bavanakutayimas/:id').get(getBavanakutayimaById).put(updateBavanakutayima).delete(deleteBavanakutayima);

/**
 * @swagger
 * /api/houses:
 *   get:
 *     summary: Get all houses
 *     tags: [Houses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all houses
 *
 * /api/houses/{id}:
 *   get:
 *     summary: Get house by ID
 *     tags: [Houses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: House details
 *   put:
 *     summary: Update house
 *     tags: [Houses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: House updated successfully
 *   delete:
 *     summary: Delete house
 *     tags: [Houses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: House deleted successfully
 */
router.route('/houses').get(getAllHouses).post(createHouse);
router.route('/houses/:id').get(getHouseById).put(updateHouse).delete(deleteHouse);

/**
 * @swagger
 * /api/members:
 *   get:
 *     summary: Get all members
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Member'
 *
 * /api/members/{id}:
 *   get:
 *     summary: Get member by ID
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member details
 *   put:
 *     summary: Update member
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member updated successfully
 *   delete:
 *     summary: Delete member
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member deleted successfully
 */
router.route('/members').get(getAllMembers).post(createMember);

// Member Self-Service Routes - MUST come before /members/:id to avoid route conflicts
router.get('/members/me', getMyProfile);
router.put('/members/me', updateMyProfile);
router.get('/members/me/transactions', getMyTransactions);
router.get('/members/me/spiritual-activities', getMySpiritualActivities);
router.post('/members/me/spiritual-activities', createMySpiritualActivity);

router.route('/members/:id').get(getMemberById).put(updateMember).delete(deleteMember);

// Member Credentials Management Routes
router.get('/members-credentials/with-login', getMembersWithCredentials);
router.get('/members-credentials/without-login', getMembersWithoutCredentials);
router.get('/members-credentials/export', exportCredentialsList);
router.post('/members-credentials/bulk-generate', bulkGenerateCredentials);
router.post('/members-credentials/:id/generate', generateMemberCredentials);
router.post('/members-credentials/:id/reset-password', resetMemberPassword);
router.delete('/members-credentials/:id/remove', removeMemberCredentials);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.route('/users').get(getAllUsers).post(createUser);
router.route('/users/:id').put(updateUser).delete(deleteUser);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 *   put:
 *     summary: Update transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *   delete:
 *     summary: Delete transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 */
router.route('/transactions').get(getAllTransactions).post(createTransaction);
router.route('/transactions/:id').get(getTransactionById).put(updateTransaction).delete(deleteTransaction);

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all campaigns
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details
 *   put:
 *     summary: Update campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *   delete:
 *     summary: Delete campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 */
router.route('/campaigns').get(getAllCampaigns).post(createCampaign);
router.route('/campaigns/:id').get(getCampaignById).put(updateCampaign).delete(deleteCampaign);
router.post('/campaigns/process-dues', processCampaignDues);

/**
 * @swagger
 * /api/spiritual-activities:
 *   get:
 *     summary: Get all spiritual activities
 *     tags: [Spiritual Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all spiritual activities
 *   post:
 *     summary: Create a new spiritual activity
 *     tags: [Spiritual Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Spiritual activity created successfully
 *
 * /api/spiritual-activities/{id}:
 *   get:
 *     summary: Get spiritual activity by ID
 *     tags: [Spiritual Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Spiritual activity details
 *   put:
 *     summary: Update spiritual activity
 *     tags: [Spiritual Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Spiritual activity updated successfully
 *   delete:
 *     summary: Delete spiritual activity
 *     tags: [Spiritual Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Spiritual activity deleted successfully
 */
router.route('/spiritual-activities').get(getAllSpiritualActivities).post(createSpiritualActivity);
router.route('/spiritual-activities/:id').get(getSpiritualActivityById).put(updateSpiritualActivity).delete(deleteSpiritualActivity);

// News Routes
router.route('/news').get(getAllNews).post(createNews);
router.route('/news/:id').get(getNewsById).put(updateNews).delete(deleteNews);

// Events Routes
router.route('/events').get(getAllEvents).post(createEvent);
router.route('/events/:id').get(getEventById).put(updateEvent).delete(deleteEvent);

// Active News and Events for Members
router.get('/news/active/list', getActiveNews);
router.get('/events/active/list', getActiveEvents);

// Stothrakazhcha Routes
router.route('/stothrakazhcha').get(getAllStothrakazhcha).post(createStothrakazhcha);
router.get('/stothrakazhcha/current/week', getCurrentWeekStothrakazhcha);
router.post('/stothrakazhcha/:id/contribute', addContribution);
router.route('/stothrakazhcha/:id').get(getStothrakazhchaById).put(updateStothrakazhcha).delete(deleteStothrakazhcha);

// Stothrakazhcha Dues Routes
router.route('/stothrakazhcha-dues').get(getAllStothrakazhchaDues);
router.route('/stothrakazhcha-dues/:id').get(getStothrakazhchaDueById).delete(deleteStothrakazhchaDue);
router.post('/stothrakazhcha-dues/process', processStothrakazhchaDues);
router.post('/stothrakazhcha-dues/:id/pay', markDueAsPaid);
router.get('/stothrakazhcha-dues/entity/:entityType/:entityId', getDuesForEntity);

export default router;
