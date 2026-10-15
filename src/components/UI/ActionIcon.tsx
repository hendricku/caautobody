import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import type { ComponentProps } from "react";

type ActionIconProps = ComponentProps<typeof ArrowForwardRounded> & {
  external?: boolean;
};

/**
 * A consistent, font-independent action icon for links and buttons.
 * SVG icons avoid platform emoji substitution in iOS and in-app browsers.
 */
export default function ActionIcon({ external = false, className = "", ...props }: ActionIconProps) {
  const Icon = external ? ArrowOutwardRounded : ArrowForwardRounded;
  return <Icon className={`ui-action-icon ${className}`.trim()} aria-hidden="true" focusable="false" {...props} />;
}
