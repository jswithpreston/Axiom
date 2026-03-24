import { createContext, useContext } from "react";

interface MobileMenuContextValue {
  openMenu: () => void;
}

export const MobileMenuContext = createContext<MobileMenuContextValue>({
  openMenu: () => {},
});

export function useMobileMenu(): MobileMenuContextValue {
  return useContext(MobileMenuContext);
}
