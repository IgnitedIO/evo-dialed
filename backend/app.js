// Import env variables (development if necessary)
require('dotenv').config();
if (process.env.NODE_ENV === "development") {
  const result = require("dotenv").config({ path: ".env.dev" });
  process.env = {...process.env, ...result.parsed};
}

// Dependencies
const express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

// App Config
const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// CORS Middleware
var corsWL = [
  'https://dialedapi.evomarketing.co', 
  'https://dialed.evomarketing.co',
]; //white list consumers
if (process.env.NODE_ENV === "development") corsWL = [...corsWL, 'http://localhost', 'http://localhost:80', 'http://localhost:28528', 'http://localhost:5050', 'http://127.0.0.1', 'http://127.0.0.1:80', 'http://127.0.0.1:28528', 'http://127.0.0.1:5050'];
// Allow requests from any port in development
if (process.env.NODE_ENV === "development") {
  corsWL = [...corsWL, ...corsWL.map(url => url.includes('localhost') || url.includes('127.0.0.1') ? url : '')].filter(Boolean);
}
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our whitelist
    if (corsWL.indexOf(origin) !== -1) callback(null, true);
    else {
      // Optional: Log rejected origins for debugging
      console.log(`CORS rejected origin: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true, //Credentials are cookies, authorization headers or TLS client certificates.
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'device-remember-token', 'Access-Control-Allow-Origin', 'Origin', 'Accept']
}));

// Session Middleware
const session = require('express-session');
const authPass = require('./auth_pass/native.js');
var app_session_config = {
  'name': "evodialed.user.session",
  'secret': "6d8cd4acfa600e9996ce5fc81a9ca07918f5ef2d41dc19fc94e3b2f89bf710ec",
  'cookie': {
    'maxAge': 60000 * 60 * 24, // 24 hours
    'secure': false,
    'sameSite': "lax"
  },
  'saveUninitialized': true,
  'resave': false
};
if (process.env.NODE_ENV !== "development") {
  var RedisStore = require('connect-redis').default;
  const Redis = require('ioredis');
  const CACHE_SERVER = new Redis({ host: process.env.CACHE_SERVER_HOSTNAME, port: process.env.CACHE_SERVER_PORT });
  app_session_config['store'] = new RedisStore({
    client: CACHE_SERVER,
    prefix: "evodialed-user-ssn:",
  });
}
app.use(session(app_session_config));
app.use(authPass.initialize());
app.use(authPass.session());

// Middleware Routes
const authRoute = require('./routes/auth/routes.js');
const creatorsDashboardRoute = require('./routes/creators/dashboard/routes.js');
const creatorsIntegrationsRoute = require('./routes/creators/integrations/routes.js');
const creatorsCampaignsRoute = require('./routes/creators/campaigns/routes.js');
const internalCampaignsRoute = require('./routes/internal/campaigns/routes.js');
const internalCreatorsRoute = require('./routes/internal/creators/routes.js');
const internalDashboardRoute = require('./routes/internal/dashboard/routes.js');
const internalMetricsRoute = require('./routes/internal/metrics/routes.js');
const internalTeamRoute = require('./routes/internal/team/routes.js');
const publicCampaignsRoute = require('./routes/public/campaigns/routes.js');
const settingsRoute = require('./routes/settings/routes.js');
const webhooksRoute = require('./routes/webhooks/routes.js');
const internalCreativeApprovalRoute = require('./routes/internal/creative_approval/routes.js');
const creatorsCreativeApprovalRoute = require('./routes/creators/creative_approval/routes.js');
const internalMissionControlRoute = require('./routes/internal/mission_control/routes.js');

// Routes
const route_prefix = (process.env.NODE_ENV === "development") ? "/api" : "";
app.use(route_prefix+'/auth/', authRoute);
app.use(route_prefix+'/creators/dashboard/', creatorsDashboardRoute);
app.use(route_prefix+'/creators/integrations/', creatorsIntegrationsRoute);
app.use(route_prefix+'/creators/campaigns/', creatorsCampaignsRoute);
app.use(route_prefix+'/internal/campaigns/', internalCampaignsRoute);
app.use(route_prefix+'/internal/creators/', internalCreatorsRoute);
app.use(route_prefix+'/internal/dashboard/', internalDashboardRoute);
app.use(route_prefix+'/internal/metrics/', internalMetricsRoute);
app.use(route_prefix+'/internal/team/', internalTeamRoute);
app.use(route_prefix+'/public/campaigns/', publicCampaignsRoute);
app.use(route_prefix+'/settings/', settingsRoute);
app.use(route_prefix+'/webhooks/', webhooksRoute);

// V1.1 Routes - Creative Approval
app.use(route_prefix+'/internal/creative-approval/', internalCreativeApprovalRoute);
app.use(route_prefix+'/creators/creative-approval/', creatorsCreativeApprovalRoute);

// V2.0 Routes - Mission Control
app.use(route_prefix+'/internal/mission-control/', internalMissionControlRoute);

// Catch unhandled requests
app.all('/*', (_, res) => { res.sendStatus(404); });

// Expose app
const PORT = process.env.PORT || 5050;
var server = app.listen(PORT, () => {
	console.log(`listening to requests on port ${PORT}`);
});
server.setTimeout(330000); // 5min 30s


// -------------------
// BullMQ Metrics Queue
// -------------------

// BullMQ Metrics Queue Initialization
const { scheduleMetricsScraping } = require('./tasks/metrics_scrape/scheduler');
const { instagramWorker, tiktokWorker } = require('./tasks/metrics_scrape/processor');

// BullMQ Metrics Slack Reporting Initialization
const { initializeMetricsSlackSystem, worker: metricsSlackWorker } = require('./tasks/metrics_slack/index.js');

// BullMQ Creative Approval Notifications Initialization
const { initializeCreativeApprovalNotifs, worker: creativeApprovalNotifsWorker } = require('./tasks/creativeapproval_notifs/index.js');

// [V2.0] BullMQ Mission Control Auto-Transitions Initialization
const { initializeMCTransitions, worker: mcTransitionsWorker } = require('./tasks/mc_transitions/index.js');

// Start BullMQ metrics scraping scheduler
scheduleMetricsScraping();

// Start BullMQ metrics Slack reporting system
initializeMetricsSlackSystem();

// [V1.1] Creative Approval - Start BullMQ creative approval notifications system
initializeCreativeApprovalNotifs();

// [V2.0] Mission Control - Start BullMQ auto-transitions system
initializeMCTransitions();

// Handle graceful shutdown for BullMQ workers
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing server...');
    await instagramWorker.close();
    await tiktokWorker.close();
    await metricsSlackWorker.close();
    await creativeApprovalNotifsWorker.close();
    await mcTransitionsWorker.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});