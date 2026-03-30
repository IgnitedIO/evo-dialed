// Dependencies
const HttpStatus = require('../../types/HttpStatus.js');

// Function Imports
const {
	tasks_tiktok_getVideoAnalytics
} = require("../../tasks/metrics_scrape/tiktok.js");
const {
	tasks_instagram_getReelsAnalytics,
} = require("../../tasks/metrics_scrape/instagram.js");

/**
 * Backfill metrics for Instagram
 */
async function backfill_metrics_ig(req, res) {
	console.log("Backfilling IG!");
	const ok = await tasks_instagram_getReelsAnalytics();
	if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
	return res.sendStatus(HttpStatus.FAILED_STATUS);
}

/**
 * Backfill metrics for TikTok
 */
async function backfill_metrics_tt(req, res) {
	console.log("Backfilling TT!");
	const ok = await tasks_tiktok_getVideoAnalytics();
	if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
	return res.sendStatus(HttpStatus.FAILED_STATUS);
}

// Export controllers
module.exports = {
	backfill_metrics_ig,
	backfill_metrics_tt,
};