import { isValidUrl } from "../../utils/contactFormatter";

const normalizeUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  if (!trimmed) return url;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
};

const SocialLink = ({ url, icon: Icon, size = 17, className = "" }) => {
  const href = normalizeUrl(url);

  if (!isValidUrl(href)) {
    return (
      <span title="Link not available" className="inline-flex cursor-default opacity-40">
        <Icon size={size} className={className} />
      </span>
    );
  }

  return (
    <a
      href={href}
      onClick={(e) => e.stopPropagation()}
      title={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon
        size={size}
        className={`text-blue-500 cursor-pointer ${className}`}
      />
    </a>
  );
};

export default SocialLink;
