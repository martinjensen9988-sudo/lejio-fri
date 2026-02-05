interface LejioLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const LejioLogo = ({ size = "md", showText = true }: LejioLogoProps) => {
  const sizes = {
    sm: { container: "w-9 h-9", text: "text-xl", spark: "w-2 h-2 -top-0.5 -right-0.5" },
    md: { container: "w-11 h-11", text: "text-2xl", spark: "w-2.5 h-2.5 -top-0.5 -right-0.5" },
    lg: { container: "w-14 h-14", text: "text-3xl", spark: "w-3 h-3 -top-1 -right-1" },
  };

  return (
    <div className="flex items-center gap-3 group">
      <div className={`${sizes[size].container} rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-xl group-hover:shadow-primary/40 transition-all group-hover:scale-105`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-2/3 h-2/3"
        >
          {/* Car silhouette - friendly rounded */}
          <path
            d="M6 17C6 17 7 12 8 11C9 10 12 10 16 10C20 10 23 10 24 11C25 12 26 17 26 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-foreground"
          />
          <path
            d="M5 17H27V21C27 22 26 23 25 23H7C6 23 5 22 5 21V17Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-foreground"
          />
          {/* Happy wheels */}
          <circle cx="10" cy="21" r="2.5" fill="currentColor" className="text-secondary" />
          <circle cx="22" cy="21" r="2.5" fill="currentColor" className="text-secondary" />
          {/* Windshield smile */}
          <path
            d="M13 14C14 15 18 15 19 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-primary-foreground"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex items-baseline relative">
          <span className={`font-display font-black ${sizes[size].text} text-primary tracking-tight`}>
            LEJ
          </span>
          <span className={`font-display font-black ${sizes[size].text} text-primary tracking-tight relative`}>
            I
            {/* Yellow spark above the I */}
            <span className={`absolute ${sizes[size].spark} bg-secondary rounded-full animate-bounce-soft`} />
          </span>
          <span className={`font-display font-black ${sizes[size].text} text-primary tracking-tight`}>
            O
          </span>
        </div>
      )}
    </div>
  );
};

export default LejioLogo;
