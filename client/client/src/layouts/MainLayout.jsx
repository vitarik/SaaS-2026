import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, Sparkles, User, X } from "lucide-react";

const STORAGE_KEY = "ui.sidebarCollapsed";
const PHONE_BREAKPOINT = 720;

const Layout = ({ children }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= PHONE_BREAKPOINT);
  const [menuOpen, setMenuOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "1";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    const onResize = () => {
      const nextMobile = window.innerWidth <= PHONE_BREAKPOINT;
      setIsMobile(nextMobile);
      if (!nextMobile) setMenuOpen(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const toggleSidebar = () => {
      if (window.innerWidth <= PHONE_BREAKPOINT) {
        setMenuOpen((current) => !current);
      }
    };

    window.addEventListener("app-shell:toggle-sidebar", toggleSidebar);
    return () => window.removeEventListener("app-shell:toggle-sidebar", toggleSidebar);
  }, []);

  useEffect(() => {
    if (!isMobile || !menuOpen) return undefined;

    const state = window.history.state || {};
    window.history.pushState({ ...state, mobileMenuOpen: true }, "");

    const onPopState = () => {
      setMenuOpen(false);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [isMobile, menuOpen]);

  const handleCloseMenu = () => {
    setMenuOpen(false);

    if (isMobile && window.history.state?.mobileMenuOpen) {
      window.history.back();
    }
  };

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      description: "Overview and status",
      icon: <LayoutDashboard size={18} />,
    },
    {
      path: "/profile",
      label: "Profile",
      description: "Identity and account",
      icon: <User size={18} />,
    },
    {
      path: "/settings",
      label: "Settings",
      description: "Preferences and defaults",
      icon: <Settings size={18} />,
    },
  ];

  const sidebarClassName = [
    "sidebar",
    isMobile && menuOpen ? "is-open" : "",
    !isMobile && collapsed ? "is-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const frameClassName = [
    "app-layout__frame",
    !isMobile && collapsed ? "is-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="app-layout">
      <div
        className={`app-layout__overlay ${isMobile && menuOpen ? "is-open" : ""}`}
        onClick={handleCloseMenu}
      />
      <div className={frameClassName}>
        <aside className={sidebarClassName}>
          <div className="sidebar__top">
            {(!collapsed || isMobile) && (
              <div className="sidebar__title">
                <span className="sidebar__label">Workspace</span>
                <strong>Starter navigation</strong>
                <span>Reusable sections for new products.</span>
              </div>
            )}
            {isMobile ? (
              <button
                onClick={handleCloseMenu}
                title="Close menu"
                className="icon-button"
                type="button"
              >
                <X size={18} />
              </button>
            ) : (
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand menu" : "Collapse menu"}
                className="icon-button"
                type="button"
          >
            {collapsed ? "»" : "«"}
          </button>
            )}
        </div>

          <nav className="sidebar__nav">
            {navItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${active ? "is-active" : ""}`}
                >
                  <div className="sidebar-link__icon">{item.icon}</div>
                  {(!collapsed || isMobile) && (
                    <div className="sidebar-link__copy">
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {(!collapsed || isMobile) && (
            <div className="sidebar__footer">
              <strong>Template-ready</strong>
              Neutral layout, clean spacing, and mobile-friendly navigation.
            </div>
          )}
        </aside>

        <div className="content-wrap">
          <main className="page-stack">
            <div className="hero-card">
              <div className="hero-card__top">
                <div className="page-header">
                  <span className="section-badge">
                    <Sparkles size={14} />
                    Product shell
                  </span>
                  <h1 className="page-title">A clean base for any SaaS workflow.</h1>
                  <p className="page-subtitle">
                    Keep the structure, swap the copy, and add product-specific modules
                    without reworking the entire frontend.
                  </p>
                </div>

                <div className="hero-card__stats">
                  <div className="stat-pill">
                    <div className="stat-pill__label">Responsive</div>
                    <div className="stat-pill__value">Mobile-first</div>
                  </div>
                  <div className="stat-pill">
                    <div className="stat-pill__label">Style</div>
                    <div className="stat-pill__value">Neutral UI</div>
                  </div>
                </div>
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
