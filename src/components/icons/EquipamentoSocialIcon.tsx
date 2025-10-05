interface EquipamentoSocialIconProps {
  className?: string;
}

export const EquipamentoSocialIcon = ({ className }: EquipamentoSocialIconProps) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
    >
      <path 
        d="M 40 90 L 100 40 L 160 90" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      <line 
        x1="40" 
        y1="90" 
        x2="40" 
        y2="160" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round"
      />
      <line 
        x1="160" 
        y1="90" 
        x2="160" 
        y2="160" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round"
      />
      <line 
        x1="40" 
        y1="160" 
        x2="160" 
        y2="160" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round"
      />
      
      <circle 
        cx="100" 
        cy="110" 
        r="12" 
        fill="currentColor"
      />
      <path 
        d="M 85 155 Q 85 130 100 122 Q 115 130 115 155 Z" 
        fill="currentColor"
      />
    </svg>
  );
};
