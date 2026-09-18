/**
 * Notification Service Module
 * Handles sending SMS and Email notifications for Appointment status transitions.
 */

export const sendConfirmation = async (appointment) => {
  console.log(`[NOTIFICATION SERVICE] 📩 Sending Appointment CONFIRMATION:`);
  console.log(`  To: ${appointment.patient_name} (${appointment.mobile || appointment.phone})`);
  console.log(`  Appointment ID: ${appointment.appointment_id || appointment.id}`);
  console.log(`  Doctor: ${appointment.doctor_name || 'Assigned Specialist'}`);
  console.log(`  Date/Time: ${appointment.preferred_date || appointment.appointment_date} at ${appointment.preferred_time || '09:00 AM'}`);
  console.log(`  Token Number: #${appointment.token_number || 1}`);
  console.log(`  Message: Your appointment with ${appointment.doctor_name} has been CONFIRMED. Token Number: #${appointment.token_number || 1}. Please arrive 15 minutes before your slot.`);
  return { success: true, type: 'CONFIRMATION', recipient: appointment.mobile };
};

export const sendReschedule = async (appointment, newDate, newTime) => {
  console.log(`[NOTIFICATION SERVICE] 🗓️ Sending Appointment RESCHEDULE:`);
  console.log(`  To: ${appointment.patient_name} (${appointment.mobile || appointment.phone})`);
  console.log(`  Appointment ID: ${appointment.appointment_id || appointment.id}`);
  console.log(`  New Date/Time: ${newDate} at ${newTime}`);
  console.log(`  Message: Your appointment has been RESCHEDULED to ${newDate} at ${newTime}.`);
  return { success: true, type: 'RESCHEDULE', recipient: appointment.mobile };
};

export const sendCancellation = async (appointment, reason) => {
  console.log(`[NOTIFICATION SERVICE] ❌ Sending Appointment CANCELLATION:`);
  console.log(`  To: ${appointment.patient_name} (${appointment.mobile || appointment.phone})`);
  console.log(`  Appointment ID: ${appointment.appointment_id || appointment.id}`);
  console.log(`  Reason: ${reason || 'Administrative reschedule request'}`);
  console.log(`  Message: Your appointment #${appointment.appointment_id} has been CANCELLED. Reason: ${reason || 'N/A'}`);
  return { success: true, type: 'CANCELLATION', recipient: appointment.mobile };
};

export const sendNoShow = async (appointment) => {
  console.log(`[NOTIFICATION SERVICE] ⚠️ Sending Appointment NO-SHOW Notice:`);
  console.log(`  To: ${appointment.patient_name} (${appointment.mobile || appointment.phone})`);
  console.log(`  Appointment ID: ${appointment.appointment_id || appointment.id}`);
  console.log(`  Message: You missed your appointment #${appointment.appointment_id}. Please contact front desk to rebook.`);
  return { success: true, type: 'NO_SHOW', recipient: appointment.mobile };
};

export default {
  sendConfirmation,
  sendReschedule,
  sendCancellation,
  sendNoShow
};
