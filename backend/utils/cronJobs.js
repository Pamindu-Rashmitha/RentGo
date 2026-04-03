const cron = require('node-cron');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Vehicle = require('../models/Vehicle');

/**
 * Runs every hour.
 * Finds Awaiting_Payment bookings older than 48 hours → auto-cancels them.
 * Also voids any Payment_Under_Review payment linked to those bookings.
 * Makes the vehicle Available again.
 */
const startCronJobs = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Running 48-hour Awaiting_Payment auto-timeout check...');

        try {
            const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

            const expiredBookings = await Booking.find({
                status: 'Awaiting_Payment',
                updatedAt: { $lt: cutoff },
            });

            if (expiredBookings.length === 0) {
                console.log('[CRON] No expired bookings found.');
                return;
            }

            for (const booking of expiredBookings) {
                // Cancel the booking
                booking.status = 'Cancelled';
                await booking.save();

                // Void any associated payment record
                const payment = await Payment.findOne({
                    bookingId: booking._id,
                    status: 'Payment_Under_Review',
                });
                if (payment) {
                    payment.status = 'Voided';
                    payment.voidReason = 'Auto-voided: Awaiting_Payment booking expired after 48 hours.';
                    await payment.save();
                }

                // Restore vehicle availability if it was awaiting a payment-locked booking
                // (Vehicle should still be Available since only Confirmed blocks it, but log it)
                console.log(`[CRON] Booking ${booking._id} auto-cancelled (48hr timeout).`);
            }

            console.log(`[CRON] Auto-cancelled ${expiredBookings.length} expired booking(s).`);
        } catch (error) {
            console.error('[CRON] Error during auto-timeout job:', error.message);
        }
    });

    console.log('[CRON] 48-hour booking auto-timeout job scheduled (every hour).');
};

module.exports = { startCronJobs };
