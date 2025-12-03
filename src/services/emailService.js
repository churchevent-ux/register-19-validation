import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_6bswnv8';
const EMAILJS_TEMPLATE_ID = 'template_b7zcbv3';
const USER_ID = 'a8_hcbsJ06oPYRp5f';

/**
 * Initialize EmailJS with your public key
 */
export const initEmailJS = () => {
  console.log('🔧 Initializing EmailJS with USER_ID:', USER_ID);
  emailjs.init(USER_ID);
  console.log('✅ EmailJS initialized successfully');
};

/**
 * Send registration confirmation email
 * @param {Object} registrationData - The registration data
 * @returns {Promise} - EmailJS response promise
 */
export const sendRegistrationEmail = async (registrationData) => {
  try {
    console.log('📧 Starting email send process...');
    console.log('📋 Registration data received:', registrationData);
    
    // Prepare template parameters based on your EmailJS template
    const templateParams = {
      to_email: registrationData.email,
      reply_to: registrationData.email,
      user_email: registrationData.email,
      email: registrationData.email,
      to_name: registrationData.participantName || registrationData.fullName,
      participant_name: registrationData.participantName || registrationData.fullName,
      unique_id: registrationData.uniqueId || registrationData.volunteerId,
      registration_date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      event_name: registrationData.volunteerId ? 'Volunteer Registration - DEO GRATIAS 2025' : 'Teens & Kids Retreat - DEO GRATIAS 2025',
      event_dates: 'December 28-30, 2025',
      category: registrationData.category || 'Volunteer',
      contact_number: registrationData.primaryContactNumber || registrationData.phone,
    };

    console.log('📤 Sending email with params:', templateParams);
    console.log('🔑 Using Service ID:', EMAILJS_SERVICE_ID);
    console.log('📝 Using Template ID:', EMAILJS_TEMPLATE_ID);

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Email sent successfully!', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('❌ Error details:', error.text || error.message);
    throw error;
  }
};

/**
 * Send email using a specific template
 * @param {string} templateId - EmailJS template ID
 * @param {Object} templateParams - Parameters for the email template
 * @returns {Promise} - EmailJS response promise
 */
export const sendCustomEmail = async (templateId, templateParams) => {
  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      templateParams
    );
    
    console.log('Custom email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending custom email:', error);
    throw error;
  }
};

export default {
  initEmailJS,
  sendRegistrationEmail,
  sendCustomEmail
};
