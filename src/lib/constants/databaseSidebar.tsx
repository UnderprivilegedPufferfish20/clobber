import { HomeIcon, DatabaseIcon, ShapesIcon, CoinsIcon, GitCompareArrows, ShoppingBasketIcon, MapIcon, Key, CableIcon, RefreshCcwDotIcon, GitBranchIcon, CogIcon } from "lucide-react";

export const routes = [
  {
    href: "",
    label: "Home",
    icon: HomeIcon,
  },
  {
    href: "/schema",
    label: "Schema",
    icon: MapIcon,
  },
  {
    href: "/auth",
    label: "Auth",
    icon: Key,
  },
  {
    href: "/data-api",
    label: "API",
    icon: CableIcon,
  },
  {
    href: "/backups",
    label: "Backups",
    icon: RefreshCcwDotIcon,
  },
  {
    href: "/branches",
    label: "Branches",
    icon: GitBranchIcon,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: CogIcon,
  }
]