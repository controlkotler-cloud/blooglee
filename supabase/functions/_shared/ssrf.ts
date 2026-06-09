// Shared SSRF protection helpers.
// Use these in any edge function that fetches user-supplied URLs.

export function stripIpv6Brackets(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "");
}

export function isLocalOrPrivateIpv4(hostname: string): boolean {
  const ip = hostname.trim();
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return false;

  const octets = ip.split(".").map((n) => Number(n));
  if (octets.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;

  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

export function isLocalOrPrivateIpv6(hostname: string): boolean {
  const ip = stripIpv6Brackets(hostname).toLowerCase();
  if (!ip.includes(":")) return false;

  if (ip === "::1" || ip === "::") return true;
  if (ip.startsWith("fe80:")) return true; // link-local
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // unique local
  if (ip.startsWith("::ffff:")) {
    // IPv4-mapped IPv6
    const v4 = ip.slice(7);
    if (isLocalOrPrivateIpv4(v4)) return true;
  }
  return false;
}

export function isLocalOrPrivateHostname(hostname: string): boolean {
  const host = stripIpv6Brackets(hostname).toLowerCase();
  if (!host) return true;
  if (host === "localhost" || host === "localhost.localdomain") return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host.endsWith(".home.arpa")) return true;
  if (isLocalOrPrivateIpv4(host)) return true;
  if (isLocalOrPrivateIpv6(host)) return true;
  return false;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
