import { useEffect, useState } from "react";
import { Trash2, Plus, X, Loader2, ShieldCheck, Wrench, FlaskConical } from "lucide-react";
import { usersApi } from "../../api/users";
import type { UserResponse } from "../../api/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN:      "Системный администратор",
  RESOURCE_OPERATOR: "Оператор ресурсов",
  QA_ENGINEER:       "QA-инженер",
};

const ROLE_COLORS: Record<string, string> = {
  SYSTEM_ADMIN:      "bg-red-500/15 text-red-400 border border-red-500/30",
  RESOURCE_OPERATOR: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  QA_ENGINEER:       "bg-green-500/15 text-green-400 border border-green-500/30",
};

const ROLE_ICONS: Record<string, typeof ShieldCheck> = {
  SYSTEM_ADMIN:      ShieldCheck,
  RESOURCE_OPERATOR: Wrench,
  QA_ENGINEER:       FlaskConical,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── create dialog ─────────────────────────────────────────────────────────────

interface CreateDialogProps {
  onClose: () => void;
  onCreated: (user: UserResponse) => void;
}

function CreateUserDialog({ onClose, onCreated }: CreateDialogProps) {
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("QA_ENGINEER");
  const [error,    setError]    = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  const submit = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Заполните все поля");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Некорректный адрес электронной почты");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await usersApi.create({ username: username.trim(), email: email.trim(), password, role });
      onCreated(created);
    } catch (e: any) {
      const body = e?.body as { errors?: { message: string }[] } | undefined;
      const messages = body?.errors?.map(err => err.message).join("; ");
      setError(messages ?? e?.message ?? "Ошибка создания пользователя");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Новый пользователь</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary ${
                email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                  ? "border-destructive focus:ring-destructive"
                  : "border-border"
              }`}
            />
            {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
              <p className="mt-1 text-xs text-destructive">Некорректный адрес электронной почты</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Роль</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="QA_ENGINEER">QA-инженер</option>
              <option value="RESOURCE_OPERATOR">Оператор ресурсов</option>
              <option value="SYSTEM_ADMIN">Системный администратор</option>
            </select>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── delete confirm dialog ─────────────────────────────────────────────────────

interface DeleteDialogProps {
  user: UserResponse;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

function DeleteUserDialog({ user, onClose, onDeleted }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await usersApi.remove(user.id);
      onDeleted(user.id);
    } catch (e: any) {
      setError(e?.message ?? "Ошибка удаления");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Удалить пользователя?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Пользователь <span className="font-medium text-foreground">{user.username}</span> будет удалён без возможности восстановления.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={confirm}
            disabled={deleting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────

export function UsersPage() {
  const [users,         setUsers]         = useState<UserResponse[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [deletingUser,  setDeletingUser]  = useState<UserResponse | null>(null);

  useEffect(() => {
    usersApi.list()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (user: UserResponse) => {
    setUsers(prev => [user, ...prev]);
    setShowCreate(false);
  };

  const handleDeleted = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeletingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление пользователями</h2>
          <p className="text-muted-foreground">Учётные записи организации</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Создать пользователя
        </button>
      </div>

      {/* stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {(["SYSTEM_ADMIN", "RESOURCE_OPERATOR", "QA_ENGINEER"] as const).map(role => {
          const Icon = ROLE_ICONS[role];
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
              <div className={`rounded-full p-2 ${ROLE_COLORS[role]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Пользователь</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Роль</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Создан</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Пользователи не найдены
                </td>
              </tr>
            )}
            {users.map((u, idx) => {
              const Icon = ROLE_ICONS[u.role] ?? ShieldCheck;
              return (
                <tr key={u.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs uppercase">
                        {u.username.slice(0, 2)}
                      </div>
                      <span className="font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-3 w-3" />
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeletingUser(u)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Удалить
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateUserDialog
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {deletingUser && (
        <DeleteUserDialog
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
