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
    const { contractType, customerName, customerEmail, customerPhone, listingId, contractText } = req.body;

    if (!contractType || !customerName || !customerEmail) {
      context.res.status = 400;
      context.res.body = { error: "Missing required fields" };
      return context.res;
    }

    const contractId = uuidv4();
    let emailSent = false;

    await withLessorClient(req, async (client, lessorId) => {
      // Create contract in database
      await client.query(`
        INSERT INTO fri_dealer_contracts 
        (id, lessor_id, listing_id, contract_type, customer_name, customer_email, customer_phone, contract_text, status, created_at, updated_at)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_signature', NOW(), NOW())
      `, [contractId, lessorId, listingId, contractType, customerName, customerEmail, customerPhone, contractText]);

      // Try to send email
      try {
        const contractLink = `${process.env.APP_URL}/sign-contract/${contractId}`;
        
        await transporter.sendMail({
          from: process.env.FROM_EMAIL || 'noreply@lejio.dk',
          to: customerEmail,
          subject: `Kontrakt til underskrivning - ${contractType}`,
          html: `
            <h2>Hej ${customerName}</h2>
            <p>Du har modtaget en kontrakt til underskrivning:</p>
            <p><strong>Kontrakttype:</strong> ${contractType}</p>
            ${contractText ? `<p><strong>Vilkår:</strong></p><p>${contractText}</p>` : ''}
            <p><a href="${contractLink}" style="background-color: #8b6f47; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Underskriv kontrakt</a></p>
            <p>Med venlig hilsen<br/>LEJIO Bilforhandler</p>
          `
        });
        emailSent = true;
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
        // Continue anyway - contract is created even if email fails
      }
    });

    context.res.status = 201;
    context.res.body = { 
      id: contractId, 
      status: 'pending_signature',
      emailSent,
      message: emailSent ? 'Kontrakt sendt til kunde' : 'Kontrakt oprettet (email send fejlede)'
    };
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
