import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CollectionsSortDropdownProps = {
  sortOption: string;
  onSortChange: (value: string) => void;
};

const CollectionsSortDropdown = ({
  sortOption,
  onSortChange
}: CollectionsSortDropdownProps) => {
  return (
    <Select value={sortOption} onValueChange={onSortChange}>
      <SelectTrigger className="w-[130px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="oldest">Oldest</SelectItem>
        <SelectItem value="most_plaques">Most Plaques</SelectItem>
        <SelectItem value="alphabetical">A to Z</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default CollectionsSortDropdown;