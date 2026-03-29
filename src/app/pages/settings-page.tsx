import { useState, useEffect } from "react";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { swaggerSpecsApi } from "../../api/swagger-specs";
import type { SwaggerSpecResponse } from "../../api/types";

export function SettingsPage() {
  // Swagger specs state
  const [specs, setSpecs] = useState<SwaggerSpecResponse[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecUrl, setNewSpecUrl] = useState('');
  const [specSaving, setSpecSaving] = useState(false);
  const [specError, setSpecError] = useState<string | null>(null);

  useEffect(() => {
    setSpecsLoading(true);
    swaggerSpecsApi.list().then(setSpecs).catch(() => {}).finally(() => setSpecsLoading(false));
  }, []);

  const handleAddSpec = async () => {
    if (!newSpecName.trim() || !newSpecUrl.trim()) return;
    setSpecSaving(true);
    setSpecError(null);
    try {
      const created = await swaggerSpecsApi.create({ name: newSpecName.trim(), url: newSpecUrl.trim() });
      setSpecs((prev) => [created, ...prev]);
      setNewSpecName('');
      setNewSpecUrl('');
    } catch {
      setSpecError('Не удалось сохранить спецификацию');
    } finally {
      setSpecSaving(false);
    }
  };

  const handleDeleteSpec = async (id: string) => {
    try {
      await swaggerSpecsApi.delete(id);
      setSpecs((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setSpecError('Не удалось удалить спецификацию');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Настройки</h2>
        <p className="text-muted-foreground">
          Управление вашей учетной записью и настройками приложения
        </p>
      </div>

      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Swagger / OpenAPI спецификации</CardTitle>
              <CardDescription>
                Сохранённые спецификации можно выбрать в конструкторе сценариев при AI-генерации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {specError && <p className="text-sm text-destructive">{specError}</p>}

              {specsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
                </div>
              ) : specs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Спецификации не добавлены</p>
              ) : (
                <div className="space-y-2">
                  {specs.map((spec) => (
                    <div key={spec.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{spec.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{spec.url}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteSpec(spec.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">Добавить спецификацию</p>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="spec-name">Название</Label>
                    <Input
                      id="spec-name"
                      placeholder="Например: Payments API v2"
                      value={newSpecName}
                      onChange={(e) => setNewSpecName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="spec-url">URL спецификации</Label>
                    <Input
                      id="spec-url"
                      placeholder="https://api.example.com/swagger.json"
                      value={newSpecUrl}
                      onChange={(e) => setNewSpecUrl(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  className="gap-2"
                  onClick={handleAddSpec}
                  disabled={specSaving || !newSpecName.trim() || !newSpecUrl.trim()}
                >
                  {specSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Добавить
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}