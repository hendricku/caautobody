export const publicModules = [
  { id: "home", label: "Home", route: "/" },
  { id: "about", label: "About", route: "/about" },
  { id: "services", label: "Services", route: "/services" },
  { id: "offers", label: "Offers", route: "/offers" },
  { id: "locations", label: "Areas We Serve", route: "/areas-we-serve" },
  { id: "blog", label: "Blog", route: "/blog" },
  { id: "gallery", label: "Gallery", route: "/gallery" },
  { id: "faq", label: "FAQ", route: "/frequently-asked-questions" },
  { id: "contact", label: "Contact", route: "/contact" }
] as const;

export const adminModules = [
  { id: "dashboard", label: "Dashboard", route: "/caautobodyadmin/dashboard" },
  { id: "blogs", label: "Blogs", route: "/caautobodyadmin/blogs" },
  { id: "services", label: "Services", route: "/caautobodyadmin/services" },
  { id: "gallery", label: "Gallery", route: "/caautobodyadmin/gallery" },
  { id: "faq", label: "FAQ", route: "/caautobodyadmin/faq" },
  { id: "analytics", label: "Analytics", route: "/caautobodyadmin/analytics" },
  { id: "settings", label: "Settings", route: "/caautobodyadmin/settings" }
] as const;
