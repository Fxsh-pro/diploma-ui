import { Home, FileText, Play, Server, BarChart3, Settings, X } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";

interface SideNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { id: "dashboard", label: "Панель управления", icon: Home },
  { id: "scenarios", label: "Сценарии", icon: FileText },
  { id: "tests", label: "Тесты", icon: Play },
  { id: "agents", label: "Агенты", icon: Server },
  { id: "reports", label: "Отчеты", icon: BarChart3 },
  { id: "settings", label: "Настройки", icon: Settings },
];

export function SideNav({ activePage, onNavigate, isOpen = true, onClose }: SideNavProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose?.();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-medium mb-1">Нужна помощь?</p>
              <p className="text-xs text-muted-foreground mb-2">
                Ознакомьтесь с документацией и руководствами.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Документация
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}