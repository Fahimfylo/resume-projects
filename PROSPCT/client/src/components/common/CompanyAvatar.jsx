import { memo } from 'react';

/**
 * CompanyAvatar Component
 * Displays a generated avatar using the first letter of company name
 * Used as final fallback when all logo sources fail
 * 
 * @param {Object} props
 * @param {string} props.name - Company name
 * @param {number} props.size - Avatar size in pixels (default: 40)
 * @param {string} props.className - Additional CSS classes
 */
const CompanyAvatar = memo(({ 
  name, 
  size = 40, 
  className = '' 
}) => {
  // Extract first letter, fallback to 'C' for Company
  const firstLetter = name 
    ? name.trim().charAt(0).toUpperCase() 
    : 'C';
  
  // Generate consistent background color based on first letter
  const getColorForLetter = (letter) => {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#6366F1', // Indigo
    ];
    const index = letter.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  const backgroundColor = getColorForLetter(firstLetter);
  
  return (
    <div
      className={`flex items-center justify-center font-semibold text-white ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor,
        fontSize: `${size * 0.5}px`,
        flexShrink: 0
      }}
    >
      {firstLetter}
    </div>
  );
});

CompanyAvatar.displayName = 'CompanyAvatar';

export default CompanyAvatar;
