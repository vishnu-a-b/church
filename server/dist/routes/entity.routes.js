"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const entityController_1 = require("../controllers/entityController");
const stothrakazhchaController_1 = require("../controllers/stothrakazhchaController");
const stothrakazhchaDueController_1 = require("../controllers/stothrakazhchaDueController");
const memberCredentialController_1 = require("../controllers/memberCredentialController");
const churchController_1 = require("../controllers/churchController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.protect);
// Global Search
router.get('/search', entityController_1.globalSearch);
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
router.route('/churches').get(churchController_1.getAllChurches).post(churchController_1.createChurch);
router.route('/churches/:id').get(churchController_1.getChurchById).put(churchController_1.updateChurch).delete(churchController_1.deleteChurch);
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
router.route('/units').get(entityController_1.getAllUnits).post(entityController_1.createUnit);
router.route('/units/:id').get(entityController_1.getUnitById).put(entityController_1.updateUnit).delete(entityController_1.deleteUnit);
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
router.route('/bavanakutayimas').get(entityController_1.getAllBavanakutayimas).post(entityController_1.createBavanakutayima);
router.route('/bavanakutayimas/:id').get(entityController_1.getBavanakutayimaById).put(entityController_1.updateBavanakutayima).delete(entityController_1.deleteBavanakutayima);
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
router.route('/houses').get(entityController_1.getAllHouses).post(entityController_1.createHouse);
router.route('/houses/:id').get(entityController_1.getHouseById).put(entityController_1.updateHouse).delete(entityController_1.deleteHouse);
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
router.route('/members').get(entityController_1.getAllMembers).post(entityController_1.createMember);
// Member Self-Service Routes - MUST come before /members/:id to avoid route conflicts
router.get('/members/me', entityController_1.getMyProfile);
router.put('/members/me', entityController_1.updateMyProfile);
router.get('/members/me/transactions', entityController_1.getMyTransactions);
router.get('/members/me/spiritual-activities', entityController_1.getMySpiritualActivities);
router.post('/members/me/spiritual-activities', entityController_1.createMySpiritualActivity);
router.route('/members/:id').get(entityController_1.getMemberById).put(entityController_1.updateMember).delete(entityController_1.deleteMember);
// Member Credentials Management Routes
router.get('/members-credentials/with-login', memberCredentialController_1.getMembersWithCredentials);
router.get('/members-credentials/without-login', memberCredentialController_1.getMembersWithoutCredentials);
router.get('/members-credentials/export', memberCredentialController_1.exportCredentialsList);
router.post('/members-credentials/bulk-generate', memberCredentialController_1.bulkGenerateCredentials);
router.post('/members-credentials/:id/generate', memberCredentialController_1.generateMemberCredentials);
router.post('/members-credentials/:id/reset-password', memberCredentialController_1.resetMemberPassword);
router.delete('/members-credentials/:id/remove', memberCredentialController_1.removeMemberCredentials);
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
router.route('/users').get(entityController_1.getAllUsers).post(entityController_1.createUser);
router.route('/users/:id').put(entityController_1.updateUser).delete(entityController_1.deleteUser);
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
router.route('/transactions').get(entityController_1.getAllTransactions).post(entityController_1.createTransaction);
router.route('/transactions/:id').get(entityController_1.getTransactionById).put(entityController_1.updateTransaction).delete(entityController_1.deleteTransaction);
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
router.route('/campaigns').get(entityController_1.getAllCampaigns).post(entityController_1.createCampaign);
router.route('/campaigns/:id').get(entityController_1.getCampaignById).put(entityController_1.updateCampaign).delete(entityController_1.deleteCampaign);
router.post('/campaigns/process-dues', entityController_1.processCampaignDues);
router.post('/campaigns/:id/contribute', entityController_1.addCampaignContribution);
// Unified Dues endpoint (Campaign + Stothrakazhcha)
router.get('/dues', entityController_1.getAllDues);
router.post('/dues/pay', entityController_1.payDue);
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
router.route('/spiritual-activities').get(entityController_1.getAllSpiritualActivities).post(entityController_1.createSpiritualActivity);
router.route('/spiritual-activities/:id').get(entityController_1.getSpiritualActivityById).put(entityController_1.updateSpiritualActivity).delete(entityController_1.deleteSpiritualActivity);
// News Routes
router.route('/news').get(entityController_1.getAllNews).post(entityController_1.createNews);
router.route('/news/:id').get(entityController_1.getNewsById).put(entityController_1.updateNews).delete(entityController_1.deleteNews);
// Events Routes
router.route('/events').get(entityController_1.getAllEvents).post(entityController_1.createEvent);
router.route('/events/:id').get(entityController_1.getEventById).put(entityController_1.updateEvent).delete(entityController_1.deleteEvent);
// Active News and Events for Members
router.get('/news/active/list', entityController_1.getActiveNews);
router.get('/events/active/list', entityController_1.getActiveEvents);
// Stothrakazhcha Routes
router.route('/stothrakazhcha').get(stothrakazhchaController_1.getAllStothrakazhcha).post(stothrakazhchaController_1.createStothrakazhcha);
router.get('/stothrakazhcha/current/week', stothrakazhchaController_1.getCurrentWeekStothrakazhcha);
router.post('/stothrakazhcha/:id/contribute', stothrakazhchaController_1.addContribution);
router.route('/stothrakazhcha/:id').get(stothrakazhchaController_1.getStothrakazhchaById).put(stothrakazhchaController_1.updateStothrakazhcha).delete(stothrakazhchaController_1.deleteStothrakazhcha);
// Stothrakazhcha Dues Routes
router.route('/stothrakazhcha-dues').get(stothrakazhchaDueController_1.getAllStothrakazhchaDues);
router.route('/stothrakazhcha-dues/:id').get(stothrakazhchaDueController_1.getStothrakazhchaDueById).delete(stothrakazhchaDueController_1.deleteStothrakazhchaDue);
router.post('/stothrakazhcha-dues/process', stothrakazhchaDueController_1.processStothrakazhchaDues);
router.post('/stothrakazhcha-dues/:id/pay', stothrakazhchaDueController_1.markDueAsPaid);
router.get('/stothrakazhcha-dues/entity/:entityType/:entityId', stothrakazhchaDueController_1.getDuesForEntity);
exports.default = router;
//# sourceMappingURL=entity.routes.js.map