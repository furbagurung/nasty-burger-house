import {
  Facebook01Icon,
  InstagramIcon,
  TiktokIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type SocialIconName = "instagram" | "facebook" | "tiktok";

type SocialIconProps = {
  name: SocialIconName;
  className?: string;
};

const socialIcons = {
  instagram: InstagramIcon,
  facebook: Facebook01Icon,
  tiktok: TiktokIcon,
} as const;

export default function SocialIcon({ name, className }: SocialIconProps) {
  return (
    <HugeiconsIcon
      icon={socialIcons[name]}
      className={className}
      color="currentColor"
      size={24}
      strokeWidth={1.8}
      aria-hidden="true"
    />
  );
}
