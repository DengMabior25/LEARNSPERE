const {
    createHmac,
    randomInt,
    randomUUID,
    timingSafeEqual
} = require("node:crypto");

const CODE_LIFETIME_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const emailAttempts = new Map();
const ipAttempts = new Map();
const codeAttempts = new Map();

function json(res, status, body) {
    return res.status(status).json(body);
}

function rateLimited(store, key, limit) {
    const now = Date.now();
    const recent = (store.get(key) || []).filter(time => now - time < RATE_WINDOW_MS);
    if (recent.length >= limit) {
        store.set(key, recent);
        return true;
    }
    if (!store.has(key) && store.size >= 1000) {
        store.delete(store.keys().next().value);
    }
    recent.push(now);
    store.set(key, recent);
    return false;
}

function safeEqual(left, right) {
    if (typeof left !== "string" || typeof right !== "string" || !/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) {
        return false;
    }
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    return leftBuffer.length === rightBuffer.length &&
        leftBuffer.length > 0 &&
        timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(value, secret) {
    return createHmac("sha256", secret).update(value).digest("hex");
}

function codeDigest(email, nonce, code, secret) {
    return signature(`code:${email}:${nonce}:${code}`, secret);
}

function readChallenge(challenge, secret) {
    if (typeof challenge !== "string") return null;
    const [payload, providedSignature, extra] = challenge.split(".");
    if (!payload || !providedSignature || extra || !safeEqual(signature(payload, secret), providedSignature)) {
        return null;
    }

    try {
        return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
        return null;
    }
}

async function sendCode(email, code) {
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL,
            to: [email],
            subject: "Your LearnSphere confirmation code",
            text: `Your LearnSphere confirmation code is ${code}. It expires in 10 minutes.`,
            html: `<p>Your LearnSphere confirmation code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. If you did not request this code, you can ignore this email.</p>`
        })
    });

    if (!response.ok) {
        const details = await response.text();
        console.error(`Resend email request failed (${response.status}): ${details}`);
        return false;
    }
    return true;
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return json(res, 405, { error: "Method not allowed." });
    }

    const { RESEND_API_KEY, RESEND_FROM_EMAIL, VERIFICATION_SECRET } = process.env;
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !VERIFICATION_SECRET || VERIFICATION_SECRET.length < 32) {
        return json(res, 503, { error: "Email confirmation is not configured yet. Please contact the site administrator." });
    }

    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json(res, 400, { error: "Invalid request." });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json(res, 400, { error: "Enter a valid email address." });
    }

    if (body.action === "send") {
        const forwardedFor = req.headers && req.headers["x-forwarded-for"];
        const ip = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "unknown";
        if (rateLimited(emailAttempts, email, 3) || rateLimited(ipAttempts, ip, 10)) {
            return json(res, 429, { error: "Too many code requests. Wait a few minutes and try again." });
        }

        const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
        let sent;
        try {
            sent = await sendCode(email, code);
        } catch (error) {
            console.error("Resend email request failed:", error);
            return json(res, 502, { error: "The confirmation email could not be sent. Please try again later." });
        }

        if (!sent) {
            return json(res, 502, { error: "The confirmation email could not be sent. Check the email service configuration." });
        }

        const nonce = randomUUID();
        const payload = Buffer.from(JSON.stringify({
            email,
            nonce,
            codeDigest: codeDigest(email, nonce, code, VERIFICATION_SECRET),
            expiresAt: Date.now() + CODE_LIFETIME_MS
        })).toString("base64url");
        return json(res, 200, { challenge: `${payload}.${signature(payload, VERIFICATION_SECRET)}` });
    }

    if (body.action === "verify") {
        const challenge = readChallenge(body.challenge, VERIFICATION_SECRET);
        if (!challenge || challenge.email !== email || !Number.isFinite(challenge.expiresAt)) {
            return json(res, 400, { error: "Invalid or expired confirmation request. Request a new code." });
        }
        if (Date.now() > challenge.expiresAt) {
            return json(res, 410, { error: "This confirmation code has expired. Request a new code." });
        }
        if (typeof body.code !== "string" || !/^\d{6}$/.test(body.code)) {
            return json(res, 400, { error: "Enter the 6-digit confirmation code." });
        }
        const forwardedFor = req.headers && req.headers["x-forwarded-for"];
        const ip = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "unknown";
        if (rateLimited(codeAttempts, challenge.nonce, 5) ||
            rateLimited(ipAttempts, `${ip}:${challenge.nonce}`, 10)) {
            return json(res, 429, { error: "Too many verification attempts. Request a new code." });
        }
        if (!safeEqual(codeDigest(email, challenge.nonce, body.code, VERIFICATION_SECRET), challenge.codeDigest)) {
            return json(res, 400, { error: "That confirmation code is incorrect. Check the email and try again." });
        }
        return json(res, 200, { verified: true });
    }

    return json(res, 400, { error: "Invalid confirmation action." });
};
