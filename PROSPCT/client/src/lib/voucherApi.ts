import API_CONFIG from "../utils/apiConstant";

const LS_URL_KEY = "voucher_api_url";
const LS_KEY_KEY = "voucher_api_key";

function getApiUrl(): string {
  return (
    localStorage.getItem(LS_URL_KEY) ||
    import.meta.env.VITE_VOUCHER_API_URL ||
    `${API_CONFIG.API_ENDPOINT}/admin/special-deals/requests`
  );
}

function getApiKey(): string {
  return (
    localStorage.getItem(LS_KEY_KEY) ||
    import.meta.env.VITE_VOUCHER_API_KEY ||
    ""
  );
}

export function setVoucherApiUrl(url: string): void {
  localStorage.setItem(LS_URL_KEY, url);
}

export function setVoucherApiKey(key: string): void {
  localStorage.setItem(LS_KEY_KEY, key);
}

export interface VoucherPayload {
  buyer: Record<string, unknown>;
  plan: Record<string, unknown>;
  pricing: Record<string, unknown>;
  promo: Record<string, unknown>;
  payment: Record<string, unknown>;
  source: string;
  metadata: Record<string, unknown>;
}

export interface VoucherItem {
  code: string;
  token?: string;
  deal_code: string | null;
  plan_codes: number;
  redeem_url: string;
  expires_at: string | null;
}

export interface VoucherResponse {
  success: boolean;
  vouchers?: VoucherItem[];
  voucher?: VoucherItem;
  quantity?: number;
  order_id: string;
  message: string;
}

function normalizeVoucherItem(raw: Record<string, unknown>): VoucherItem {
  return {
    code: String(raw.code || raw.voucherCode || ""),
    token: (raw.token as string) || undefined,
    deal_code: (raw.deal_code as string | null) ?? null,
    plan_codes: Number(raw.plan_codes) || 1,
    redeem_url: String(raw.redeem_url || `${window.location.origin}/redeem?token=${raw.token || raw.code}`),
    expires_at: (raw.expires_at as string | null) ?? null,
  };
}

function normalizeResponse(data: Record<string, unknown>): VoucherResponse {
  if (!data) {
    return {
      success: true,
      voucher: {
        code: "",
        deal_code: null,
        plan_codes: 1,
        redeem_url: `${window.location.origin}/redeem`,
        expires_at: null,
      },
      order_id: "",
      message: "Voucher generated",
    };
  }

  const rawVouchers = data.vouchers;
  if (Array.isArray(rawVouchers) && rawVouchers.length > 0) {
    return {
      success: data.success === true,
      vouchers: rawVouchers.map((v: unknown) => normalizeVoucherItem(v as Record<string, unknown>)),
      quantity: Number(data.quantity) || rawVouchers.length,
      order_id: String(data.order_id || ""),
      message: String(data.message || "Voucher(s) generated"),
    };
  }

  const rawVoucher = data.voucher;
  let voucherItem: VoucherItem;

  if (rawVoucher && typeof rawVoucher === "object") {
    voucherItem = normalizeVoucherItem(rawVoucher as Record<string, unknown>);
  } else {
    voucherItem = normalizeVoucherItem(data);
  }

  return {
    success: data.success === true,
    voucher: voucherItem,
    quantity: 1,
    order_id: String(data.order_id || ""),
    message: String(data.message || "Voucher generated"),
  };
}

export async function submitVoucherRequest(
  payload: VoucherPayload
): Promise<VoucherResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = getApiKey();
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }

  const response = await fetch(getApiUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.message || body?.error?.message || `Voucher request failed (${response.status})`
    );
  }

  return normalizeResponse(body);
}
