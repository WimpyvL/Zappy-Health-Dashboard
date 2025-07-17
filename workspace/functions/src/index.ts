
import * as logger from "firebase-functions/logger";
import {onRequest} from "firebase-functions/v2/https";
// Although we're not using it in the function body, we need to initialize the app
// for the function to have the correct context and permissions.
import {initializeApp} from "firebase-admin/app";

initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});


export const sendProviderNotification = onRequest({cors: true}, (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).send('Method Not Allowed');
    return;
  }

  const { providerEmail, patientName, consultationId } = request.body;

  if (!providerEmail || !patientName || !consultationId) {
    logger.error("Missing required fields for notification.", { body: request.body });
    response.status(400).send('Bad Request: Missing required fields.');
    return;
  }

  // In a real application, you would integrate with an email service here.
  // For example, using Nodemailer with SendGrid/Mailgun transport.
  // const mailOptions = {
  //   from: 'Zappy Health <no-reply@zappy-health.com>',
  //   to: providerEmail,
  //   subject: `New Consultation for Patient: ${patientName}`,
  //   html: `<p>You have a new consultation pending review for ${patientName}.</p><p>Consultation ID: ${consultationId}</p><p>Please log in to the dashboard to review.</p>`
  // };
  // emailService.sendMail(mailOptions)...

  logger.info(`Simulating sending email to ${providerEmail} for patient ${patientName}.`);
  
  // Respond to the client that the request was accepted.
  response.status(200).json({ success: true, message: "Notification sent successfully." });
});

