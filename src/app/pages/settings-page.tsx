import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";

export function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Настройки</h2>
        <p className="text-muted-foreground">
          Управление вашей учетной записью и настройками приложения
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Общие</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
          <TabsTrigger value="integrations">Интеграции</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          <TabsTrigger value="resources">Ресурсы</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Организация</CardTitle>
              <CardDescription>
                Управление настройками организации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Название организации</Label>
                <Input id="org-name" defaultValue="Acme Corporation" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Часовой пояс</Label>
                <Select defaultValue="utc">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Восточное время (ET)</SelectItem>
                    <SelectItem value="pst">Тихоокеанское время (PT)</SelectItem>
                    <SelectItem value="cet">Центральноевропейское время (CET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Тестовые настройки по умолчанию</CardTitle>
              <CardDescription>
                Установите значения по умолчанию для новых тестов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-duration">Продолжительность теста по умолчанию (минут)</Label>
                <Input id="default-duration" type="number" defaultValue="15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-retention">Политика хранения данных</Label>
                <Select defaultValue="90">
                  <SelectTrigger id="data-retention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 дней</SelectItem>
                    <SelectItem value="90">90 дней</SelectItem>
                    <SelectItem value="365">1 год</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Предпочтения интерфейса</CardTitle>
              <CardDescription>
                Настройте свой интерфейс
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Темная тема</Label>
                  <p className="text-sm text-muted-foreground">
                    Использовать темную тему в приложении
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="language">Язык</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">Английский</SelectItem>
                    <SelectItem value="es">Испанский</SelectItem>
                    <SelectItem value="fr">Французский</SelectItem>
                    <SelectItem value="de">Немецкий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Сохранить изменения
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Аутентификация</CardTitle>
              <CardDescription>
                Управление настройками аутентификации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="2fa">Двухфакторная аутентификация</Label>
                  <p className="text-sm text-muted-foreground">
                    Добавьте дополнительный уровень безопасности к вашей учетной записи
                  </p>
                </div>
                <Switch
                  id="2fa"
                  checked={twoFactor}
                  onCheckedChange={setTwoFactor}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Тайм-аут сессии (минут)</Label>
                <Input id="session-timeout" type="number" defaultValue="60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API ключи</CardTitle>
              <CardDescription>
                Управление API ключами для программного доступа
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">Производственный API ключ</p>
                    <code className="text-xs text-muted-foreground">lf_••••••••••••••••••••</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Создан: 1 января 2026 • Последнее использование: 2 часа назад
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Отменить
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">Разработочный API ключ</p>
                    <code className="text-xs text-muted-foreground">lf_••••••••••••••••••••</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Создан: 15 декабря 2025 • Последнее использование: Никогда
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Отменить
                  </Button>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                + Создать новый API ключ
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Сохранить изменения
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A154B]">
                    <span className="text-white font-bold text-xl">#</span>
                  </div>
                  <div>
                    <CardTitle>Slack</CardTitle>
                    <Badge variant="secondary" className="mt-1">Подключен</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Отправлять уведомления о тестах в:
                </p>
                <code className="block rounded bg-muted px-3 py-2 text-sm">
                  #performance-alerts
                </code>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Настроить
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Отключить
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F46800]">
                    <span className="text-white font-bold">G</span>
                  </div>
                  <div>
                    <CardTitle>Grafana</CardTitle>
                    <Badge variant="outline">Не подключен</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Экспортировать метрики в Grafana для долгосрочного мониторинга
                </p>
                <Button variant="outline" className="w-full">
                  Подключить
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0052CC]">
                    <span className="text-white font-bold">J</span>
                  </div>
                  <div>
                    <CardTitle>Jira</CardTitle>
                    <Badge variant="outline">Не подключен</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Автоматически создавать тикеты при сбоях тестов
                </p>
                <Button variant="outline" className="w-full">
                  Подключить
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#181717]">
                    <span className="text-white font-bold">GH</span>
                  </div>
                  <div>
                    <CardTitle>GitHub</CardTitle>
                    <Badge variant="outline">Не подключен</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Запускать тесты при запросах на слияние
                </p>
                <Button variant="outline" className="w-full">
                  Подключить
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Уведомления по электронной почте</CardTitle>
              <CardDescription>
                Выберите события, которые вызывают уведомления по электронной почте
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Тест запущен</Label>
                  <p className="text-sm text-muted-foreground">
                    Уведомлять, когда тест начинает выполняться
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Тест завершен</Label>
                  <p className="text-sm text-muted-foreground">
                    Уведомлять, когда тест завершается
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Тест не прошел</Label>
                  <p className="text-sm text-muted-foreground">
                    Уведомлять, когда процент ошибок превышает 5%
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Агент офлайн</Label>
                  <p className="text-sm text-muted-foreground">
                    Уведомлять, когда агент становится офлайн
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ежедневный отчет</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать ежедневный отчет
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Способы доставки</CardTitle>
              <CardDescription>
                Выберите, как вы получаете уведомления
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Электронная почта</Label>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Slack</Label>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Требуется премиум-план
                  </p>
                </div>
                <Switch disabled />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Сохранить изменения
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ресурсы</CardTitle>
              <CardDescription>
                Управление ресурсами вашего аккаунта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Текущие ресурсы</Label>
                <code className="block rounded bg-muted px-3 py-2 text-sm">
                  1000 тестов/месяц
                </code>
              </div>
              <div className="space-y-2">
                <Label>Использование ресурсов</Label>
                <code className="block rounded bg-muted px-3 py-2 text-sm">
                  500 тестов/месяц
                </code>
              </div>
              <div className="space-y-2">
                <Label>Оставшиеся ресурсы</Label>
                <code className="block rounded bg-muted px-3 py-2 text-sm">
                  500 тестов/месяц
                </code>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Сохранить изменения
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}