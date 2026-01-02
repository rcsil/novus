import React from "react";

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}