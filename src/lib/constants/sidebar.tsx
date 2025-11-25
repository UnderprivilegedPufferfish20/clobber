import { HomeIcon, DatabaseIcon, ShapesIcon, CoinsIcon, GitCompareArrows, ShoppingBasketIcon } from "lucide-react";

export const routes = [
  {
    href: "",
    label: "Home",
    icon: HomeIcon,
  },
  {
    href: "/database",
    label: "Databases",
    icon: DatabaseIcon,
  },
  {
    href: "/buckets",
    label: "Buckets",
    icon: ShoppingBasketIcon,
  },
  {
    href: "/functions",
    label: "Functions",
    icon: GitCompareArrows,
  },
  {
    href: "/billing",
    label: "Billing",
    icon: CoinsIcon,
  }
]