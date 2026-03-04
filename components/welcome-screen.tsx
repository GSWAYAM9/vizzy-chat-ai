"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { getAllSuggestions } from "@/lib/suggestions"
import type { CreativeMode, SuggestionCategory } from "@/lib/types"
import {
  Palette,
  Camera,
  LayoutGrid,
  BookOpen,
  Type,
  Wand2,
  Pencil,
  Sparkles,
  BadgeCheck,
  Megaphone,
  Monitor,
  CalendarDays,
  Gift,
  Lightbulb,
  Play,
  Home,
  Briefcase,
  ChevronRight,
  ArrowRight,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  palette: Palette,
  camera: Camera,
  layout: LayoutGrid,
  book: BookOpen,
  type: Type,
  wand: Wand2,
  pencil: Pencil,
  sparkles: Sparkles,
  badge: BadgeCheck,
  megaphone: Megaphone,
  monitor: Monitor,
  calendar: CalendarDays,
  gift: Gift,
  lightbulb: Lightbulb,
  play: Play,
}

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void
}

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const [mode, setMode] = useState<CreativeMode>("home")
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const categories = getAllSuggestions(mode)

  return (
    <div className="flex flex-col items-center h-full px-4 py-8 md:py-12 overflow-y-auto">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 mb-8 md:mb-10 max-w-2xl">
        <div className="relative">
          <div className="size-20 md:size-24 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center glow-accent float">
            <Sparkles className="size-9 md:size-11 text-accent" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] tracking-tight text-balance">
            <span className="gradient-text">What will you create?</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed text-pretty">
            Describe any visual you can imagine. Generate artwork, product shots, 
            posters, brand visuals, and more. Iterate until it is perfect.
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-secondary/80 border border-border/60 mb-8 backdrop-blur-sm">
        <button
          onClick={() => { setMode("home"); setExpandedCategory(null) }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
            mode === "home"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="size-4" />
          Personal
        </button>
        <button
          onClick={() => { setMode("business"); setExpandedCategory(null) }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
            mode === "business"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Briefcase className="size-4" />
          Business
        </button>
      </div>

      {/* Category Grid */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            isExpanded={expandedCategory === cat.id}
            onToggle={() =>
              setExpandedCategory(expandedCategory === cat.id ? null : cat.id)
            }
            onSuggestionClick={onSuggestionClick}
          />
        ))}
      </div>

      {/* Bottom hint */}
      <p className="mt-8 text-xs text-muted-foreground/60 text-center">
        Or just type anything below to get started
      </p>
    </div>
  )
}

function CategoryCard({
  category,
  isExpanded,
  onToggle,
  onSuggestionClick,
}: {
  category: SuggestionCategory
  isExpanded: boolean
  onToggle: () => void
  onSuggestionClick: (s: string) => void
}) {
  const IconComponent = ICON_MAP[category.icon] || Sparkles

  return (
    <div
      className={cn(
        "group rounded-2xl border transition-all duration-300",
        isExpanded
          ? "bg-card border-accent/30 shadow-md col-span-1 sm:col-span-2"
          : "bg-card/60 border-border/60 hover:bg-card hover:border-border hover:shadow-sm"
      )}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-4 py-3.5 text-left"
      >
        <div
          className={cn(
            "size-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300",
            isExpanded
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-muted-foreground group-hover:text-foreground"
          )}
        >
          <IconComponent className="size-4.5" />
        </div>
        <span className="flex-1 text-sm font-medium text-foreground">
          {category.label}
        </span>
        <ChevronRight
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-300",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          {category.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="flex items-center gap-2 text-left px-3.5 py-3 rounded-xl bg-secondary/50 border border-border/40 text-sm text-foreground/90 hover:bg-secondary hover:border-border/80 transition-all duration-200 group/item leading-relaxed"
            >
              <span className="flex-1">{suggestion}</span>
              <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
