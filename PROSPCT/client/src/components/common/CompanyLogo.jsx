import { memo, useState, useCallback } from 'react';
import { getLogoSources, isDomainFailed, markDomainAsFailed } from '../../utils/logoHelper';
import CompanyAvatar from './CompanyAvatar';

/**
 * CompanyLogo Component
 * Displays company logos using multi-source fallback strategy:
 * 1. Clearbit (primary)
 * 2. Google favicon (secondary)
 * 3. Generated avatar (final fallback)
 * 
 * @param {Object} props
 * @param {string} props.domain - The domain or full URL of the company
 * @param {string} props.name - Company name for fallback avatar
 * @param {number} props.size - Logo size in pixels (default: 40)
 * @param {string} props.alt - Alt text for the image (default: "Company logo")
 * @param {string} props.className - Additional CSS classes
 */
const CompanyLogo = memo(({ 
  domain, 
  name, 
  size = 40, 
  alt = 'Company logo', 
  className = '' 
}) => {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  
  // Check if domain is already marked as failed
  const isFailed = isDomainFailed(domain);
  
  // Get logo sources
  const sources = getLogoSources(domain, size);
  
  // If domain is invalid or already failed, show avatar immediately
  if (isFailed || sources.length === 0) {
    return <CompanyAvatar name={name} size={size} className={className} />;
  }
  
  const currentSource = sources[sourceIndex];
  
  const handleError = useCallback(() => {
    // Try next source
    if (sourceIndex < sources.length - 1) {
      setSourceIndex(prev => prev + 1);
    } else {
      // All sources failed, mark domain as failed and show avatar
      markDomainAsFailed(domain);
      setShowFallback(true);
    }
  }, [sourceIndex, sources.length, domain]);
  
  // If all sources failed, show avatar
  if (showFallback) {
    return <CompanyAvatar name={name} size={size} className={className} />;
  }
  
  return (
    <img
      src={currentSource}
      alt={alt}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      onError={handleError}
      style={{ 
        objectFit: 'contain',
        borderRadius: '4px'
      }}
    />
  );
});

CompanyLogo.displayName = 'CompanyLogo';

export default CompanyLogo;
