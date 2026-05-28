export const BRAND_NAME = "Wave & Co.";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_EXPLORE = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?category=optical", label: "Optical" },
  { href: "/shop?category=sun", label: "Sun" },
  { href: "/about", label: "Sustainability" },
] as const;

export const FOOTER_HELP = [
  { href: "/contact", label: "Shipping & Returns" },
  { href: "/contact", label: "Privacy Policy" },
  { href: "/contact", label: "Terms of Service" },
  { href: "/contact", label: "Contact" },
] as const;

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/collections", label: "Collections", icon: "Paintbrush" },
  { href: "/admin/products", label: "Products", icon: "Glasses" },
  { href: "/admin/orders", label: "Orders", icon: "ShoppingCart" },
  { href: "/admin/appearance", label: "Appearance", icon: "Paintbrush" },
  { href: "/admin/customers", label: "Customers", icon: "Users" },
  { href: "/admin/settings", label: "Settings", icon: "Settings" },
] as const;

export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

export const SCROLL_REVEAL = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};
