import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { normalizeIndianPhone } from "../utils/phone.js";
import { prisma } from "../db.js";
import { verifyMsg91AccessToken, phoneBindingOk } from "../utils/msg91.js";
import { MIN_PASSWORD_LENGTH, allowAttempt, clientIp, TOO_MANY_ATTEMPTS, phoneAccountState } from "../utils/security.js";

const router = Router();

const WINDOW_15_MIN = 15 * 60 * 1000;
// Pre-computed hash so unknown-phone logins take the same time as wrong-password logins.
const TIMING_DUMMY_HASH = bcrypt.hashSync("fictionfigure-timing-equaliser", 10);

// 1. Mobile number format check.
// Deliberately does NOT reveal whether a number is registered (prevents account enumeration);
// duplicate registrations are reported only after the owner has verified the number by OTP.
router.post("/check-phone", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Mobile number is required" });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
    }

    res.json({ valid: true, normalizedPhone });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to check mobile number" });
  }
});

// 1b. Account state for a phone number (decides the sign-in path on the server).
// Returns only PASSWORD | ACTIVATE | NEW — never ids, names, email or other account data.
// Rate-limited to keep bulk probing of numbers impractical.
router.post("/phone-status", async (req, res) => {
  try {
    const ip = clientIp(req);
    const normalizedPhone = normalizeIndianPhone(req.body?.phone || "");
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
    }
    if (!allowAttempt(`phone-status-ip:${ip}`, 20, WINDOW_15_MIN) || !allowAttempt(`phone-status:${normalizedPhone}`, 10, WINDOW_15_MIN)) {
      return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
    }
    const user = await prisma.user.findFirst({ where: { phone: normalizedPhone }, select: { passwordHash: true } });
    res.json({ state: phoneAccountState(user), normalizedPhone });
  } catch (err: any) {
    res.status(500).json({ error: "Could not check this number. Please try again." });
  }
});

// Helper Handler for Registration & Verification
const handleRegisterCustomer = async (req: any, res: any) => {
  try {
    const { firstName, lastName, phone, password, accessToken, widgetToken, reqId } = req.body;

    const msg91Token = accessToken || widgetToken;
    const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

    if (!allowAttempt(`register:${clientIp(req)}`, 10, WINDOW_15_MIN)) {
      return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
    }

    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({ error: "First name, last name, mobile number, and password are required" });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
    }

    if (!msg91Token) {
      return res.status(400).json({ error: "MSG91 OTP access token is required for registration." });
    }

    // STRICT MSG91 SERVER-SIDE ACCESS TOKEN VALIDATION, bound to the submitted number
    const verification = await verifyMsg91AccessToken(msg91Token, reqId);
    if (!verification.ok) {
      return res.status(verification.status || 400).json({ error: verification.error });
    }
    if (!phoneBindingOk(verification, normalizedPhone, "lenient")) {
      return res.status(400).json({ error: "The verified mobile number does not match. Please verify this number again." });
    }

    // Duplicate check only AFTER the caller has proven ownership of the number.
    const existing = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
    if (existing) {
      return res.status(409).json({
        error: "PHONE_ALREADY_REGISTERED",
        message: "An account already exists for this number. Please sign in, or use Forgot password to set a new password.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: normalizedPhone,
          passwordHash,
          phoneVerified: true,
          isVerified: true,
          role: "CUSTOMER",
          email: null,
        },
      });
    } catch (dbErr: any) {
      if (dbErr.code === "P2002") {
        return res.status(409).json({
          error: "PHONE_ALREADY_REGISTERED",
          message: "An account already exists for this number. Please sign in, or use Forgot password to set a new password.",
        });
      }
      throw dbErr;
    }

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: "CUSTOMER" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (err: any) {
    console.error("register-customer error");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

// 2. Strict Server-Side Access Token Verification API (register-customer & verify-phone)
router.post("/register-customer", handleRegisterCustomer);
router.post("/verify-phone", handleRegisterCustomer);

// 3. Customer & Admin Login — identifier + password are always required.
router.post("/login", async (req, res) => {
  try {
    const { identifier, phone, email, password } = req.body;
    const rawTarget = (identifier || phone || email || "").trim();
    const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

    if (!rawTarget || !password) {
      return res.status(400).json({ error: "Mobile number (or email) and password are required" });
    }

    const ip = clientIp(req);
    if (!allowAttempt(`login:${ip}:${rawTarget.toLowerCase()}`, 8, WINDOW_15_MIN) || !allowAttempt(`login-ip:${ip}`, 40, WINDOW_15_MIN)) {
      return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
    }

    let user = null;

    if (rawTarget.includes("@")) {
      user = await prisma.user.findFirst({
        where: { email: rawTarget.toLowerCase() },
      });
    } else {
      const normalizedPhone = normalizeIndianPhone(rawTarget);
      const searchTarget = normalizedPhone || rawTarget;
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: searchTarget },
            { phone: rawTarget },
          ],
        },
      });
    }

    // Same work and same message for unknown accounts, wrong passwords and
    // passwordless legacy accounts (placeholder hashes never match).
    const isValid = await bcrypt.compare(String(password), user ? user.passwordHash : TIMING_DUMMY_HASH);
    if (!user || !isValid) {
      return res.status(401).json({ error: "Invalid mobile number or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: "Account suspended by administrator" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// 3b. Forgot password: OTP (strictly bound to the number) -> new password.
// Also the migration path for legacy checkout accounts that never had a password.
router.post("/reset-password", async (req, res) => {
  try {
    const { phone, accessToken, widgetToken, reqId, newPassword } = req.body;
    const ip = clientIp(req);

    if (!allowAttempt(`reset-ip:${ip}`, 10, WINDOW_15_MIN)) {
      return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
    }

    const normalizedPhone = normalizeIndianPhone(phone || "");
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
    }
    if (!allowAttempt(`reset-phone:${normalizedPhone}`, 5, WINDOW_15_MIN)) {
      return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
    }
    if (!newPassword || String(newPassword).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }

    const verification = await verifyMsg91AccessToken(accessToken || widgetToken, reqId);
    if (!verification.ok) {
      return res.status(verification.status || 400).json({ error: verification.error });
    }
    if (!phoneBindingOk(verification, normalizedPhone, "strict")) {
      return res.status(400).json({ error: "We couldn't confirm this number. Please verify it again with a new OTP." });
    }

    // The caller has proven ownership of this number, so a specific answer is safe here.
    const user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
    if (!user) {
      return res.status(404).json({ error: "NO_ACCOUNT", message: "No account uses this number yet. Create an account instead." });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: "Account suspended by administrator" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(String(newPassword), 10), phoneVerified: true },
    });

    res.json({ success: true, message: "Password updated. You can now sign in with your new password." });
  } catch (err: any) {
    console.error("reset-password error");
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
});

// 4. Verify Authenticated Session
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ authenticated: false });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneVerified: true,
        isVerified: true,
        isBlocked: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            items: {
              take: 1,
              select: {
                title: true,
                price: true,
                quantity: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
      },
    });

    if (!user || user.isBlocked) return res.status(401).json({ authenticated: false });

    res.json({ authenticated: true, user });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
});

// 5. Update Customer Profile
router.put("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { firstName, lastName, email } = req.body || {};

    if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) {
      return res.status(400).json({ error: "First name and last name are required." });
    }

    let cleanEmail: string | null = null;
    if (email && String(email).trim()) {
      cleanEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }

      // Check email uniqueness among other users
      const existingUser = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          NOT: { id: decoded.userId },
        },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Email address is already in use by another account." });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneVerified: true,
        isVerified: true,
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update profile." });
  }
});

router.patch("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { firstName, lastName, email } = req.body || {};

    const dataToUpdate: any = {};
    if (firstName && firstName.trim()) dataToUpdate.firstName = firstName.trim();
    if (lastName && lastName.trim()) dataToUpdate.lastName = lastName.trim();

    if (email !== undefined) {
      if (email && String(email).trim()) {
        const cleanEmail = String(email).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return res.status(400).json({ error: "Please enter a valid email address." });
        }
        const existingUser = await prisma.user.findFirst({
          where: {
            email: cleanEmail,
            NOT: { id: decoded.userId },
          },
        });
        if (existingUser) {
          return res.status(400).json({ error: "Email address is already in use by another account." });
        }
        dataToUpdate.email = cleanEmail;
      } else {
        dataToUpdate.email = null;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneVerified: true,
        isVerified: true,
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update profile." });
  }
});

export default router;
