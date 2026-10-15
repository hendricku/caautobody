export const ACCESS_COOKIE = "ca_cms_access";
export const REFRESH_COOKIE = "ca_cms_refresh";
export const ADMIN_COOKIE = "ca_cms";

export const ADMIN_COOKIE_OPTIONS = {
  name: ADMIN_COOKIE,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export const EXPIRED_ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 0,
};
