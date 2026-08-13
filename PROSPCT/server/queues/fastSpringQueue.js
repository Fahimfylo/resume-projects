const fastSpringService = require('../services/fastSpringService');
const transactionService = require('../services/transactionService');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const fastSpringQueue = {
  add: async (jobData) => {
    const { event } = jobData;
    try {
      const processedEvent = await fastSpringService.processWebhookEvent(event);

      if (!processedEvent) {
        return { success: false, reason: 'unhandled_event' };
      }

      if (processedEvent.transactionId) {
        let transaction = await transactionService.updateTransactionStatus(
          processedEvent.transactionId,
          processedEvent.status,
          event.data
        );

        // SBL flow fallback: transactionId is a FastSpring order ID, not our MongoDB ID.
        // Look up by email to find the matching pending transaction.
        if (!transaction && event.data?.email) {
          const user = await User.findOne({ email: event.data.email });
          if (user) {
            transaction = await Transaction.findOne({
              userId: user._id,
              "paymentGateway.name": "FastSpring",
              status: "PENDING",
            }).sort({ createdAt: -1 });

            if (transaction) {
              transaction = await transactionService.updateTransactionStatus(
                transaction._id,
                processedEvent.status,
                event.data
              );
            }
          }
        }

        if (processedEvent.status === "COMPLETED" && transaction) {
          await transactionService.applyTransactionBenefits(
            transaction.userId,
            transaction
          );
        }

        if (processedEvent.type === "SUBSCRIPTION" && transaction) {
          await transactionService.syncSubscriptionState(
            transaction.userId,
            processedEvent
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error(`[FastSpring] Error processing event ${event.id || 'unknown'}:`, error);
      throw error;
    }
  }
};

module.exports = fastSpringQueue;
