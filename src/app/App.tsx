import { useState } from "react";
import { TopNavbar } from "./components/top-navbar";
import { SideNav } from "./components/side-nav";
import { DashboardPage } from "./pages/dashboard-page";
import { ScenarioBuilderPage } from "./pages/scenario-builder-page";
import { TestExecutionPage } from "./pages/test-execution-page";
import { ReportsPage } from "./pages/reports-page";
import { AgentsPage } from "./pages/agents-page";
import { SettingsPage } from "./pages/settings-page";
import { TestConfigModal } from "./components/test-config-modal";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

  const [activePage, setActivePage] = useState("dashboard");
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
  const [showTestExecution, setShowTestExecution] = useState(false);
  const [showTestConfig, setShowTestConfig] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const handleMenuClick = () => setIsSideNavOpen(!isSideNavOpen);

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setShowScenarioBuilder(false);
    setShowTestExecution(false);
    setActiveRunId(null);
  };

  const handleStartTest = (runId: string) => {
    setActiveRunId(runId);
    setShowTestExecution(true);
  };

  const handleViewRun = (runId: string) => {
    setActiveRunId(runId);
    setShowTestExecution(true);
  };

  if (showScenarioBuilder) {
    return <ScenarioBuilderPage onBack={() => setShowScenarioBuilder(false)} />;
  }

  if (showTestExecution && activeRunId) {
    return (
      <TestExecutionPage
        runId={activeRunId}
        onBack={() => { setShowTestExecution(false); setActiveRunId(null); }}
      />
    );
  }

  const pageTitle = ({
    dashboard: "Панель управления",
    scenarios: "Сценарии",
    tests: "Тесты",
    agents: "Агенты",
    reports: "Отчеты",
    settings: "Настройки",
  } as Record<string, string>)[activePage] ?? "Панель управления";

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar onMenuClick={handleMenuClick} currentPage={pageTitle} />

      <SideNav
        activePage={activePage}
        onNavigate={handleNavigate}
        isOpen={isSideNavOpen}
        onClose={() => setIsSideNavOpen(false)}
      />

      <main className="lg:pl-64 pt-16">
        <div className="container mx-auto p-6">
          {activePage === "dashboard" && (
            <DashboardPage
              onViewRun={handleViewRun}
              onCreateScenario={() => setShowScenarioBuilder(true)}
              onEditScenario={() => setShowScenarioBuilder(true)}
            />
          )}

          {activePage === "scenarios" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Сценарии</h2>
                  <p className="text-muted-foreground">
                    Создание и управление сценариями нагрузочного тестирования
                  </p>
                </div>
                <button
                  onClick={() => setShowScenarioBuilder(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Создать сценарий
                </button>
              </div>
            </div>
          )}

          {activePage === "tests" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Тесты</h2>
                  <p className="text-muted-foreground">Просмотр и управление нагрузочными тестами</p>
                </div>
                <button
                  onClick={() => setShowTestConfig(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Новый тест
                </button>
              </div>
            </div>
          )}

          {activePage === "reports"  && <ReportsPage />}
          {activePage === "agents"   && <AgentsPage />}
          {activePage === "settings" && <SettingsPage />}
        </div>
      </main>

      <TestConfigModal
        open={showTestConfig}
        onClose={() => setShowTestConfig(false)}
        onStartTest={handleStartTest}
      />

      <Toaster />
    </div>
  );
}
