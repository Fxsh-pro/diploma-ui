import { useState } from "react";
import { TopNavbar } from "./components/top-navbar";
import { SideNav } from "./components/side-nav";
import { DashboardPage } from "./pages/dashboard-page";
import { ScenarioBuilderPage } from "./pages/scenario-builder-page";
import { TestExecutionPage } from "./pages/test-execution-page";
import { ReportsPage } from "./pages/reports-page";
import { AgentsPage } from "./pages/agents-page";
import { SettingsPage } from "./pages/settings-page";
import { HistoryPage } from "./pages/history-page";
import { LoginPage } from "./pages/login-page";
import { TestConfigModal } from "./components/test-config-modal";
import { RecentScenarios } from "./components/dashboard/recent-scenarios";
import { ActiveTestsTable } from "./components/dashboard/active-tests-table";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";

function AuthenticatedApp() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

  const { canDo } = useAuth();

  const [activePage, setActivePage] = useState("dashboard");
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [showTestExecution, setShowTestExecution] = useState(false);
  const [showTestConfig, setShowTestConfig] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const handleMenuClick = () => setIsSideNavOpen(!isSideNavOpen);

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setShowScenarioBuilder(false);
    setEditingScenarioId(null);
    setShowTestExecution(false);
    setActiveRunId(null);
  };

  const handleEditScenario = (id: string) => {
    setEditingScenarioId(id);
    setShowScenarioBuilder(true);
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
    return (
      <ScenarioBuilderPage
        scenarioId={editingScenarioId ?? undefined}
        onBack={() => { setShowScenarioBuilder(false); setEditingScenarioId(null); }}
      />
    );
  }

  if (showTestExecution && activeRunId) {
    return (
      <TestExecutionPage
        runId={activeRunId}
        onBack={() => { setShowTestExecution(false); setActiveRunId(null); }}
        onStartTest={handleStartTest}
      />
    );
  }

  const pageTitle = ({
    dashboard: "Панель управления",
    scenarios: "Сценарии",
    tests: "Тесты",
    agents: "Агенты",
    reports: "Отчеты",
    history: "История изменений",
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
              onCreateScenario={() => { setEditingScenarioId(null); setShowScenarioBuilder(true); }}
              onEditScenario={handleEditScenario}
              onShowAllTests={() => handleNavigate('tests')}
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
                {canDo('MANAGE_SCENARIOS') && (
                  <button
                    onClick={() => setShowScenarioBuilder(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Создать сценарий
                  </button>
                )}
              </div>
              <RecentScenarios
                limit={0}
                onCreateNew={() => { setEditingScenarioId(null); setShowScenarioBuilder(true); }}
                onEdit={handleEditScenario}
              />
            </div>
          )}

          {activePage === "tests" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Тесты</h2>
                  <p className="text-muted-foreground">Просмотр и управление нагрузочными тестами</p>
                </div>
                {canDo('MANAGE_TEST_RUNS') && (
                  <button
                    onClick={() => setShowTestConfig(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Новый тест
                  </button>
                )}
              </div>
              <ActiveTestsTable showAll onView={handleViewRun} />
            </div>
          )}

          {activePage === "reports"  && <ReportsPage onStartTest={handleStartTest} />}
          {activePage === "agents"   && <AgentsPage />}
          {activePage === "history"  && <HistoryPage />}
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

function AppContent() {
  const { user } = useAuth();
  return user ? <AuthenticatedApp /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
