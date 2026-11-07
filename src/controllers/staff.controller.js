const { Payment, Member } = require("../migrations");

module.exports.SubscribeToMembership = async (req, res) => {
  try {
    const { userId, title, duration, amount } = req.body;

    const member = await Member.findOne({ memberId: userId });
    if (!member) {
      return res.json({ message: "Member profile not found." });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (duration || 1));

    member.subscriptions = member.subscriptions || [];
    member.subscriptions.push({
      title,
      startDate,
      endDate,
      amount,
      status: "pending",
    });

    await member.save();

    res.status(200).json({
      success: true,
      message: "Subscription assigned successfully. Awaiting payment approval.",
      subscription: member.subscriptions[member.subscriptions.length - 1],
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

module.exports.approvePayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    payment.status = "approved";
    await payment.save();
    res.json({ message: "Payment approved successfully", payment });
  } catch (error) {
    res.json({ message: "Error approving payment", error });
  }
};

module.exports.getPendingPayments = async (req, res) => {
  try {
    const pendingPayments = await Payment.find({ status: "pending" });
    res.json({ pendingPayments });
  } catch (error) {
    res.json({ message: "Error fetching pending payments", error });
  }
};
