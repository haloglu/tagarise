export function requestTimeout(ms = 20_000) {
  return (req, res, next) => {
    const t = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({ ok: false, error: "gateway_timeout" });
      }
    }, ms);
    res.on("finish", () => clearTimeout(t));
    next();
  };
}
