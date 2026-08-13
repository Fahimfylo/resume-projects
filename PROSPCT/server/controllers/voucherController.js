const crypto = require('crypto');
const Voucher = require('../models/Voucher');
const SpecialDeal = require('../models/SpecialDeal');
const logger = require('../utils/logger');

function generateVoucherCode(prefix) {
  const p = prefix || 'PROSPCT';
  return `${p}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function matchDeal(payload) {
  const planCodes = payload?.plan?.codes || payload?.plan_codes;
  const price = payload?.pricing?.amount || payload?.pricing?.priceUSD;

  if (!planCodes) return null;

  const deal = await SpecialDeal.findOne({ codes: planCodes, isActive: true }).lean();
  if (deal) return deal;

  if (price) {
    return SpecialDeal.findOne({ priceUSD: price, isActive: true }).lean();
  }

  return null;
}

async function generateVoucher(req, res) {
  const requiredApiKey = process.env.VOUCHER_API_KEY;
  if (requiredApiKey) {
    const providedKey = req.headers['x-api-key'];
    if (providedKey !== requiredApiKey) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
  }

  try {
    const payload = req.body;
    const invoiceNumber = payload?.payment?.invoice_number || payload?.invoice_number;
    if (!invoiceNumber) {
      logger.warn({ msg: "[VOUCHER] Missing invoice_number", buyerEmail: payload?.buyer?.email });
      return res.status(400).json({ message: 'invoice_number is required' });
    }

    const buyerEmail = payload?.buyer?.email || '';
    const planCodes = payload?.plan?.codes || payload?.plan_codes || 1;

    logger.info({ msg: "[VOUCHER] Generation request", invoiceNumber, buyerEmail, planCodes, source: payload?.source });

    let existingVouchers = await Voucher.find({ invoiceNumber }).lean();
    if (existingVouchers.length > 0) {
      logger.info({ msg: "[VOUCHER] Idempotent hit - vouchers already exist", invoiceNumber, count: existingVouchers.length });
      const deal = existingVouchers[0].payload ? await matchDeal(existingVouchers[0].payload).catch(() => null) : null;
      const existingList = existingVouchers.map((v) => ({
        code: v.voucherCode,
        token: v.redeemToken,
        deal_code: deal?.code || null,
        plan_codes: planCodes,
        redeem_url: `${process.env.FRONTEND_URL || 'https://app.prospct.io'}/redeem?token=${v.redeemToken}`,
        expires_at: v.expiresAt,
      }));
      return res.status(200).json({
        success: true,
        code: existingList[0].code,
        voucher: existingList[0],
        vouchers: existingList,
        order_id: invoiceNumber,
        message: 'Voucher(s) already exist (idempotent)',
      });
    }

    const deal = await matchDeal(payload);
    const prefix = deal?.code || 'PROSPCT';
    const quantity = planCodes;

    if (!deal) {
      logger.warn({ msg: "[VOUCHER] No matching deal found", invoiceNumber, planCodes, prefix, source: payload?.source });
    } else {
      logger.info({ msg: "[VOUCHER] Deal matched", dealCode: deal.code, invoiceNumber, source: payload?.source });
    }

    const perRedeemCredits = {
      emailCredits: deal ? Math.floor((deal.emailCredits || 0) / quantity) : 0,
      phoneCredits: deal ? Math.floor((deal.phoneCredits || 0) / quantity) : 0,
      verificationCredits: deal ? Math.floor((deal.verificationCredits || 0) / quantity) : 0,
      exportCredits: deal ? Math.floor((deal.exportCredits || 0) / quantity) : 0,
      emailSeats: deal ? Math.floor((deal.emailSeats || 0) / quantity) : 0,
    };

    const vouchers = [];
    for (let i = 0; i < quantity; i++) {
      let voucherCode;
      for (let attempts = 0; attempts < 10; attempts++) {
        const candidate = generateVoucherCode(prefix);
        // eslint-disable-next-line no-await-in-loop
        const existing = await Voucher.findOne({ voucherCode: candidate });
        if (!existing) {
          voucherCode = candidate;
          break;
        }
      }
      if (!voucherCode) {
        logger.error({ msg: "[VOUCHER] Failed to generate unique code after 10 attempts", invoiceNumber, prefix });
        return res.status(500).json({ message: 'Failed to generate unique voucher code' });
      }

      const redeemToken = crypto.randomUUID();

      // eslint-disable-next-line no-await-in-loop
      const voucher = await Voucher.create({
        voucherCode,
        redeemToken,
        invoiceNumber,
        payload,
        buyerEmail,
        quantity: 1,
        perRedeemCredits,
        expiresAt: deal?.expiresAt || null,
      });
      vouchers.push(voucher);
    }

    logger.info({ msg: "[VOUCHER] Vouchers created", count: vouchers.length, invoiceNumber, buyerEmail, source: payload?.source });

    const voucherList = vouchers.map((v) => ({
      code: v.voucherCode,
      token: v.redeemToken,
      deal_code: deal?.code || null,
      plan_codes: planCodes,
      redeem_url: `${process.env.FRONTEND_URL || 'https://app.prospct.io'}/redeem?token=${v.redeemToken}`,
      expires_at: v.expiresAt,
    }));
    return res.status(200).json({
      success: true,
      code: voucherList[0].code,
      voucher: voucherList[0],
      vouchers: voucherList,
      order_id: invoiceNumber,
      quantity,
      message: deal ? `${quantity} voucher(s) generated for deal ${deal.code}` : `${quantity} voucher(s) generated successfully`,
    });
  } catch (err) {
    logger.error({ msg: "[VOUCHER] Error generating voucher", error: err.message, stack: err.stack });
    return res.status(500).json({ message: err.message });
  }
}

async function listVouchers(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [vouchers, totalCount] = await Promise.all([
      Voucher.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Voucher.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      vouchers,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
    });
  } catch (err) {
    console.error('Error listing vouchers:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { generateVoucher, listVouchers };
