"use client";

import { useState, useRef, useEffect } from "react";
import { X, Search, Menu, LogOut, User, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/reservation", label: "Reservation" },
  { href: "/catering", label: "Catering" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header>
      <nav className="header__nav">
        <div className="header__logo">
          <Link href="/">
            <h4 data-aos="fade-down">Sushimoto</h4>
          </Link>
          <div className="header__logo-overlay"></div>
        </div>

        <ul className="header__menu" data-aos="fade-down">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>

        <div className="header__actions">
          <div ref={menuRef} className="relative">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-7 h-7 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center hover:bg-primary-dark transition-colors"
                  title={user?.name}
                >
                  {initials}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-9 z-30 w-44 bg-white rounded-lg shadow-xl border border-border py-2">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/sign-up"
                className="text-xs font-bold uppercase tracking-wider bg-primary text-white px-3 py-1.5 rounded-full hover:bg-primary-dark transition-colors"
              >
                Login
              </Link>
            )}
          </div>
          <Link href="/orders" className="relative">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
          <Link href="/menu">
            <Search className="w-5 h-5" />
          </Link>
        </div>

        <ul className="header__menu-mobile" data-aos="fade-down">
          <li className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-7 h-7 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center"
                title={user?.name}
              >
                {initials}
              </button>
            ) : (
              <Link href="/sign-up" className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="w-6 h-6 text-secondary" />
              ) : (
                <Menu className="w-6 h-6 text-secondary" />
              )}
            </button>
          </li>
        </ul>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 bg-secondary flex flex-col items-center justify-center gap-8" style={{ zIndex: 999 }}>
          <button
            className="absolute top-6 right-6"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-8 h-8 text-white" />
          </button>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white text-2xl font-body uppercase tracking-wider hover:opacity-70 transition-opacity"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <Link
                href="/orders"
                className="text-white text-xl font-body hover:opacity-70 transition-opacity"
                onClick={() => setMobileOpen(false)}
              >
                My Orders
              </Link>
              <Link
                href="/profile"
                className="text-white text-xl font-body hover:opacity-70 transition-opacity"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="text-white/70 text-lg font-body hover:text-white transition-colors mt-4"
              >
                Sign Out
              </button>
            </>
          )}
          {!isAuthenticated && (
            <Link
              href="/sign-up"
              className="bg-primary text-white text-xl font-body px-8 py-2 rounded-full hover:bg-primary-dark transition-colors mt-4"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
