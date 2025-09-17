// utils/validate.js
import { z } from "zod";

// username: 1–30, a-z 0-9 . _ -
const usernameSchema = z
  .string()
  .min(1)
  .max(30)
  .regex(/^[a-z0-9._-]+$/i, "invalid_characters");

// platforms: query string -> array (boşsa [])
const platformsSchema = z
  .string()
  .transform((val) =>
    val
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean)
  )
  .default(""); // missing -> "" -> []

export function validateCheck(adapters) {
  const known = Object.keys(adapters);
  return (req, res, next) => {
    try {
      const username = usernameSchema.parse(req.query.username);
      const platforms = platformsSchema.parse(req.query.platforms); // -> []

      // geçersiz platformları tespit et
      const invalids = platforms.filter((p) => !known.includes(p));
      if (invalids.length) {
        return res
          .status(400)
          .json({ ok: false, error: "invalid_platform", invalids });
      }

      // doğrulanmış değerleri request içine koy
      req.validated = { username, platforms }; // her zaman array
      next();
    } catch (err) {
      return res.status(400).json({
        ok: false,
        error: "validation_failed",
        details: err?.errors || err?.message,
      });
    }
  };
}
