import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

const footerNav = [
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/reservation", label: "Reservation" },
  { href: "/catering", label: "Catering" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const socialLinks = [
  { href: "#", icon: Facebook, label: "Facebook" },
  { href: "#", icon: Instagram, label: "Instagram" },
  { href: "#", icon: Twitter, label: "Twitter" },
];

export function Footer() {
  return (
    <footer className="footer flex-between">
      <h3 className="footer__logo">
        <span>Sushi</span>moto
      </h3>

      <ul className="footer__nav">
        {footerNav.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>

      <ul className="footer__social">
        {socialLinks.map((social) => {
          const Icon = social.icon;
          return (
            <li key={social.label} className="flex-center">
              <a href={social.href} aria-label={social.label}>
                <Icon className="w-[45%] h-[45%] text-white object-contain" />
              </a>
            </li>
          );
        })}
      </ul>
    </footer>
  );
}
