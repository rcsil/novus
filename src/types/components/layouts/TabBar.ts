export interface Tab {
  id: string;
  name: string;
  isActive: boolean;
  isDirty: boolean;
}

export interface TabBarProps {
  tabs: Tab[];
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}