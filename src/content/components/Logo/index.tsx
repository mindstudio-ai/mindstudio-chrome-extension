type LogoProps = {
  width?: number;
  height?: number;
};

// Aspect ratio 500:294
const Logo = ({ width, height, ...rest }: LogoProps) => {
  let resolvedWidth = width;
  let resolvedHeight = height;

  if (resolvedWidth) {
    resolvedHeight = (resolvedWidth / 500) * 294;
  } else if (resolvedHeight) {
    resolvedWidth = (resolvedHeight / 294) * 500;
  }

  return (
    <svg
      width={resolvedWidth || "100%"}
      height={resolvedHeight || "100%"}
      viewBox="0 0 500 294"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M220.455 69.0404C217.015 79.5103 214.91 90.6612 209.911 100.336C183.279 151.886 156.203 203.216 128.72 254.325C109.082 290.844 68.6078 303.843 34.5176 285.449C1.34953 267.553 -9.70976 227.458 9.24072 191.185C36.6268 138.768 64.0075 86.3344 92.4367 34.4744C108.052 5.98846 139.402 -5.60247 170.269 3.24165C199.116 11.5075 218.824 38.1132 220.455 69.0404Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M405.424 68.7064C401.984 79.1764 399.879 90.3272 394.881 100.002C368.248 151.552 341.172 202.882 313.689 253.991C294.052 290.51 253.577 303.509 219.487 285.115C186.319 267.219 175.259 227.124 194.21 190.851C221.596 138.434 248.977 86.0005 277.406 34.1404C293.021 5.65448 324.372 -5.93645 355.238 2.90766C384.085 11.1735 403.793 37.7793 405.424 68.7064Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M433.798 88.1226C452.867 121.588 471.675 153.892 489.804 186.614C507.386 218.35 501.744 255.021 476.621 277.265C451.785 299.255 415.202 299.232 390.722 277.211C365.778 254.773 360.346 217.918 377.917 186.404C396.12 153.756 414.834 121.424 433.798 88.1226Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default Logo;
