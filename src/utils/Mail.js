import dotenv from "dotenv";
import SibApiV3Sdk from "sib-api-v3-sdk";

dotenv.config();

// Utility function to validate email format
const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
};

// Mail function to send OTP email via Brevo
export const mail = async (userToSend, otp) => {
    try {
        // Validate the environment variables for API key and sender email
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.BREVO_OTP_USER_CREDENTIAL;

        if (!apiKey) {
            throw new Error("API key is not set. Please check your environment variable (BREVO_API_KEY).");
        }
        if (!senderEmail) {
            throw new Error("Sender email is not set. Please check your environment variable (BREVO_OTP_USER_CREDENTIAL).");
        }

        // Validate recipient email address
        if (!userToSend || (typeof userToSend === "object" && !userToSend.email) || !isValidEmail(userToSend.email || userToSend)) {
            throw new Error(`Invalid recipient email address: ${userToSend.email || userToSend}. Please check the email format.`);
        }

        const recipientEmail = typeof userToSend === "object" ? userToSend.email : userToSend; // Extract the email address from object or directly use string

        console.log("Recipient email:", recipientEmail);  // Log recipient email

        // Set up Brevo client and send email
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKeyAuth = defaultClient.authentications["api-key"];
        apiKeyAuth.apiKey = apiKey;

        const transactionalApi = new SibApiV3Sdk.TransactionalEmailsApi();
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.sender = { email: senderEmail };
        sendSmtpEmail.to = [{ email: recipientEmail }];
        sendSmtpEmail.subject = "OTP Verification";
        sendSmtpEmail.textContent = `This is your OTP code: ${otp}`;
        sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px; padding: 20px;">
            <div style="text-align: center;">
                <!-- Font Awesome Icon (requires icon font) or similar option -->
                <i style="font-size: 80px;" class="fas fa-heart"></i>
                <h2 style="color: #333;">Q59 Notification</h2>
            </div>
            <p style="color: #555; font-size: 16px;">We noticed some irregularities related to heart failure. Your verification OTP is listed below:</p>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 15px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <p style="text-align: center; font-size: 24px; font-weight: bold; color: #4CAF50; margin: 0;">${otp}</p>
            </div>
            <p style="color: #555; font-size: 16px;">Please use this OTP to complete your verification. If you have any concerns, feel free to reach out.</p>
            <p style="color: #888; font-size: 14px;">This message is generated automatically, please do not reply.</p>
        </div>
    `;
    

        

        // Send the OTP email via Brevo
        await transactionalApi.sendTransacEmail(sendSmtpEmail);
        console.log("OTP email sent successfully via Brevo");
    } catch (error) {
        // Enhanced error handling with more useful logging
        if (error.response) {
            console.error("Error sending OTP email via Brevo:", error.response.body);
        } else {
            console.error("Error sending OTP email via Brevo:", error.message || error);
        }
    }
};
