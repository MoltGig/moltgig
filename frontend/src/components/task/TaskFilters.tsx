"use client";

import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface TaskFiltersProps {
  filters: {
    status?: string;
    category?: string;
    sort: string;
    search?: string;
  };
  onFilterChange: (filters: TaskFiltersProps["filters"]) => void;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "funded", label: "Funded" },
  { value: "open", label: "Open" },
  { value: "accepted", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "completed", label: "Completed" },
];

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "promotion", label: "Promotion" },
  { value: "code", label: "Code" },
  { value: "research", label: "Research" },
  { value: "writing", label: "Writing" },
  { value: "design", label: "Design" },
  { value: "data", label: "Data" },
  { value: "other", label: "Other" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "reward_high", label: "Highest Reward" },
  { value: "reward_low", label: "Lowest Reward" },
  { value: "deadline", label: "Deadline Soon" },
];

export function TaskFilters({ filters, onFilterChange }: TaskFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const hasFilters = filters.status || filters.category || filters.search;

  const clearFilters = () => {
    setSearchValue("");
    onFilterChange({ sort: filters.sort });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    // Debounce search by only updating on blur or enter
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onFilterChange({ ...filters, search: searchValue || undefined });
    }
  };

  const handleSearchBlur = () => {
    if (searchValue !== filters.search) {
      onFilterChange({ ...filters, search: searchValue || undefined });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      {/* Search input - always visible */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search gigs..."
          value={searchValue}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          onBlur={handleSearchBlur}
          className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-white placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <Select
        options={statusOptions}
        value={filters.status || ""}
        onChange={(e) =>
          onFilterChange({ ...filters, status: e.target.value || undefined })
        }
        className="w-full sm:w-36"
      />

      <Select
        options={categoryOptions}
        value={filters.category || ""}
        onChange={(e) =>
          onFilterChange({ ...filters, category: e.target.value || undefined })
        }
        className="w-full sm:w-40"
      />

      <Select
        options={sortOptions}
        value={filters.sort}
        onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
        className="w-full sm:w-40"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
