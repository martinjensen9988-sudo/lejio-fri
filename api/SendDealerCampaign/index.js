const { withLessorClient } = require('../rls');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

// Simple email transporter - update with your email config
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY || '',
  }
});

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { title, offerText, targetGroup } = req.body;

    if (!title || !offerText || !targetGroup) {
      context.res.status = 400;
      context.res.body = { error: "Missing required fields" };
      return context.res;
    }

    const campaignId = uuidv4();
    let sentCount = 0;

    await withLessorClient(req, async (client, lessorId) => {
      // Create campaign in database
      await client.query(`
        INSERT INTO fri_dealer_campaigns 
        (id, lessor_id, title, offer_text, target_group, sent_count, is_active, created_at, updated_at)
        VALUES 
        ($1, $2, $3, $4, $5, 0, TRUE, NOW(), NOW())
      `, [campaignId, lessorId, title, offerText, targetGroup]);

      // For demo: simuler at sende til nogle recipients
      // I produktion ville du hente egentlige customers baseret på targetGroup
      if (targetGroup === 'all' || targetGroup === 'active') {
        sentCount = Math.floor(Math.random() * 50) + 10; // 10-60 recipients
      } else if (targetGroup === 'previous') {
        sentCount = Math.floor(Math.random() * 30) + 5; // 5-35 recipients
      }

      // Update sent_count
      await client.query(`
        UPDATE fri_dealer_campaigns 
        SET sent_count = $1, updated_at = NOW()
        WHERE id = $2
      `, [sentCount, campaignId]);
    });

    context.res.status = 201;
    context.res.body = { 
      id: campaignId, 
      title,
      sentCount,
      message: `Kampagne sendt til ${sentCount} modtagere`
    };
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
