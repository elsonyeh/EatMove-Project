"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, X } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string, location: string) => void
  initialQuery?: string
  initialLocation?: string
}

export function SearchBar({ onSearch, initialQuery = "", initialLocation = "台北市信義區" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && initialQuery) {
      handleSearch()
    }
  }, [isMounted, initialQuery])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    onSearch(query, location)
  }

  const handleClearSearch = () => {
    setQuery("")
    onSearch("", location)
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜尋餐廳或美食類型..."
            className="pl-10 pr-10 py-6 border-brand-primary/20 focus-visible:ring-brand-primary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">清除搜尋</span>
            </button>
          )}
        </div>
        <div className="relative md:w-1/3">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="您的位置"
            className="pl-10 pr-4 py-6 border-brand-secondary/20 focus-visible:ring-brand-secondary"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="py-6 px-8 bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 transition-opacity"
        >
          <Search className="h-5 w-5 mr-2" />
          搜尋
        </Button>
      </div>
    </form>
  )
}
