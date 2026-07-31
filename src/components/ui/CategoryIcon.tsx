import {
  Activity,
  Apple,
  BadgePercent,
  Box,
  Building2,
  Carrot,
  Coffee,
  CreditCard,
  Disc,
  Dog,
  DollarSign,
  Droplet,
  Droplets,
  FileText,
  Flame,
  FlaskConical,
  Footprints,
  Gift,
  Glasses,
  Hammer,
  Headphones,
  HeartPulse,
  Home,
  Megaphone,
  Milk,
  Package,
  Paintbrush,
  Palette as PaletteIcon,
  Pill,
  Printer,
  Receipt,
  RotateCcw,
  Scissors,
  Send,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  Trophy,
  Truck,
  Users,
  Utensils,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'

const ICON_REGISTRY: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  Apple,
  BadgePercent,
  Box,
  Building2,
  Carrot,
  Coffee,
  CreditCard,
  Disc,
  Dog,
  DollarSign,
  Droplet,
  Droplets,
  FileText,
  Flame,
  FlaskConical,
  Footprints,
  Gift,
  Glasses,
  Hammer,
  Headphones,
  HeartPulse,
  Home,
  Megaphone,
  Milk,
  Package,
  Paintbrush,
  Palette: PaletteIcon,
  Pill,
  Printer,
  Receipt,
  RotateCcw,
  Scissors,
  Send,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  Trophy,
  Truck,
  Users,
  Utensils,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
  Wrench,
  Zap,
}

interface CategoryIconProps {
  icon?: string | null
  className?: string
  fallbackClassName?: string
}

export function CategoryIcon({ icon, className = 'size-4', fallbackClassName }: CategoryIconProps) {
  if (!icon || icon.trim() === '') {
    return <Tag className={cn(fallbackClassName ?? 'text-zinc-400', className)} />
  }

  const trimmed = icon.trim()
  const LucideComp = ICON_REGISTRY[trimmed]

  if (LucideComp) {
    return <LucideComp className={className} />
  }

  // If it's emoji or single text string, render as text span
  return <span className="inline-block leading-none select-none">{trimmed}</span>
}
