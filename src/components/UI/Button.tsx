import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "@/components/UI/Icon";

type ButtonVariant = "gold" | "black" | "outline" | "ghost-light" | "hero-secondary";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  arrow?: boolean;
  className?: string;
  target?: string;
  rel?: string;
}

const variantClass: Record<ButtonVariant, string> = {
  gold: "hp-btn--gold",
  black: "hp-btn--black",
  outline: "hp-btn--outline",
  "ghost-light": "hp-btn--ghost-light",
  "hero-secondary": "hp-btn--hero-secondary",
};

export default function Button({
  href,
  children,
  variant = "gold",
  arrow = false,
  className = "",
  target,
  rel,
}: ButtonProps) {
  const classes = ["hp-btn", variantClass[variant], arrow ? "hp-btn--arrow" : "", className]
    .filter(Boolean)
    .join(" ");
  const content = <>{children}{arrow ? <Icon name="arrow-forward" /> : null}</>;

  if (href.startsWith("/") || href.startsWith("#")) {
    return <Link className={classes} href={href}>{content}</Link>;
  }

  return <a className={classes} href={href} target={target} rel={rel}>{content}</a>;
}
