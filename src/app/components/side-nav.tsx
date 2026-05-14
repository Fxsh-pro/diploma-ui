import { Home, FileText, Play, Server, BarChart3, Settings, X, History, Users, CalendarClock } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import type { Action } from "../../api/types";

interface SideNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: Array<{ id: string; label: string; icon: typeof Home; requiredAction?: Action }> = [
  { id: "dashboard", label: "Панель управления", icon: Home },
  { id: "scenarios", label: "Сценарии", icon: FileText, requiredAction: "MANAGE_SCENARIOS" },
  { id: "tests", label: "Тесты", icon: Play, requiredAction: "MANAGE_TEST_RUNS" },
  { id: "schedules", label: "Расписание", icon: CalendarClock, requiredAction: "MANAGE_SCHEDULES" },
  { id: "agents", label: "Агенты", icon: Server, requiredAction: "MANAGE_AGENTS" },
  { id: "reports",  label: "Отчеты",              icon: BarChart3, requiredAction: "VIEW_METRICS" },
  { id: "history",  label: "История изменений",   icon: History,   requiredAction: "VIEW_AUDIT_LOG" },
  { id: "users",    label: "Пользователи",         icon: Users,     requiredAction: "MANAGE_USERS" },
  { id: "settings", label: "Настройки",            icon: Settings,  requiredAction: "MANAGE_USERS" },
];

export function SideNav({ activePage, onNavigate, isOpen = true, onClose }: SideNavProps) {
  const { canDo } = useAuth();

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
            {navItems
              .filter((item) => !item.requiredAction || canDo(item.requiredAction))
              .map((item) => {
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

        </div>
      </aside>
    </>
  );
}