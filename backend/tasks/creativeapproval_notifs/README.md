# Creative Approval Rejection Follow-up Notifications

This module implements an automated daily email notification system to follow up with creators about rejected creatives that have not been resubmitted.

## Overview

Every day at **10:00 AM EDT** (America/New_York timezone), the system:

1. Queries the database for rejected creatives that meet specific criteria
2. Sends email notifications to each creator with details about their rejected creative
3. Continues sending daily reminders until one of the stop conditions is met

## Stop Conditions

The system automatically stops sending notifications when any of the following occur:

- ✅ The creative is **approved**
- 🔄 The creative is **resubmitted** (a new version is submitted)
- 🗑️ The creative is **deleted**
- 📁 The campaign becomes **inactive** (archived, completed, or draft)
- ❌ The creator is **no longer assigned** to the campaign

## Database Query Logic

The system identifies creatives requiring follow-up using the following criteria:

```sql
SELECT creatives
FROM CrvApprv_Creator_Creatives
WHERE:
  - status = 'rejected'
  - campaign.status = 'active'
  - user is still assigned to campaign (Creator_Assignments)
  - creative has NOT been superseded (no newer version exists)
```

**Key Point**: A creative is considered "not resubmitted" if no other creative record exists with a `supersedes_id` pointing to its `id`.

## File Structure

```
backend/tasks/creativeapproval_notifs/
├── index.js         # Main entry point & initialization
├── queue.js         # BullMQ queue configuration
├── scheduler.js     # Cron job scheduling (10 AM EDT daily)
├── processor.js     # Worker logic, database queries, email sending
└── README.md        # This file
```

## Email Template

Located at: `backend/external_apis/resend_templates/creative_approval_emails.js`

The email includes:
- **Campaign name**: The campaign associated with the rejected creative
- **Feedback notes**: The rejection reason provided by the reviewer
- **Call-to-action button**: Link to the creator's creative approval dashboard
- **Evo Dialed branding**: Consistent with other platform emails

## Integration

The system is automatically initialized when the backend starts via `backend/app.js`:

```javascript
const { initializeCreativeApprovalNotifs, worker: creativeApprovalNotifsWorker }
    = require('./tasks/creativeapproval_notifs/index.js');

initializeCreativeApprovalNotifs();
```

## Technologies Used

- **BullMQ**: Job queue and scheduling
- **Redis**: Queue storage (via ioredis)
- **Knex.js**: Database queries
- **Resend**: Email delivery service
- **Cron**: Scheduling pattern (`0 10 * * *` for 10 AM daily)

## Environment Variables Required

```env
CACHE_SERVER_HOSTNAME=<redis-host>
CACHE_SERVER_PORT=<redis-port>
RESEND_API_KEY=<resend-api-key>
FROM_EMAIL=noreply@dialedevo.evomarketing.co
FRONTEND_URL=https://dialedevo.evomarketing.co
```

## Manual Testing

To manually trigger the notification job without waiting for the scheduled time:

```javascript
const { processCreativeApprovalNotifs } = require('./processor.js');

// Run the job immediately
await processCreativeApprovalNotifs({ id: 'test-job' });
```

## Monitoring

The system logs detailed information:

- ✅ Successful email sends
- ❌ Failed email sends
- 📊 Daily summary (count of emails sent/failed/skipped)
- 🔍 Details of each creative being processed

Example output:
```
📧 Starting creative approval rejection follow-up job...
📬 Found 3 rejected creative(s) requiring follow-up
  → Sending follow-up to creator@example.com for creative #42 (Summer Campaign)
    ✅ Sent successfully
  → Sending follow-up to another@example.com for creative #55 (Fall Campaign)
    ✅ Sent successfully
  → Sending follow-up to test@example.com for creative #67 (Spring Campaign)
    ✅ Sent successfully

📊 Summary: 3 sent, 0 failed, 0 skipped
✅ Job 12345 completed successfully
```

## Graceful Shutdown

The worker is properly registered for graceful shutdown on SIGTERM/SIGINT signals, ensuring jobs are completed before the process exits.

## Future Enhancements

Potential improvements:
- Add rate limiting to prevent email flooding
- Track notification count per creative (optional)
- Allow customization of follow-up schedule per campaign
- Add support for different notification channels (SMS, in-app notifications)
