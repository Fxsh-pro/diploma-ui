import { X, Trash2, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";

interface ExtractRule {
  name: string;
  from: 'BODY' | 'HEADER';
  path: string;
}

interface PropertiesPanelProps {
  nodeType: string;
  nodeData?: any;
  onClose: () => void;
  onUpdate?: (data: any) => void;
  onDelete?: () => void;
}

export function PropertiesPanel({ nodeType, nodeData, onClose, onUpdate, onDelete }: PropertiesPanelProps) {
  const update = (patch: Record<string, any>) => {
    onUpdate?.({ ...nodeData, ...patch });
  };

  // ── Headers helpers ──
  const headers: Record<string, string> = nodeData?.headers || {};
  const headerEntries = Object.entries(headers);

  const setHeader = (oldKey: string, newKey: string, newValue: string) => {
    const h = { ...headers };
    if (oldKey !== newKey) delete h[oldKey];
    h[newKey] = newValue;
    update({ headers: h });
  };

  const addHeader = () => {
    const h = { ...headers, '': '' };
    update({ headers: h });
  };

  const removeHeader = (key: string) => {
    const h = { ...headers };
    delete h[key];
    update({ headers: h });
  };

  // ── Extract rules helpers ──
  const extractRules: ExtractRule[] = nodeData?.extract || [];

  const setExtractRule = (idx: number, patch: Partial<ExtractRule>) => {
    const rules = [...extractRules];
    rules[idx] = { ...rules[idx], ...patch };
    update({ extract: rules });
  };

  const addExtractRule = () => {
    update({ extract: [...extractRules, { name: '', from: 'BODY', path: '' }] });
  };

  const removeExtractRule = (idx: number) => {
    update({ extract: extractRules.filter((_, i) => i !== idx) });
  };

  return (
    <div className="w-80 h-full border-l border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">Node Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-4 space-y-4">
          {nodeType === 'http' && (
            <>
              {/* Method */}
              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select
                  value={nodeData?.method || 'GET'}
                  onValueChange={(val) => update({ method: val })}
                >
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="HEAD">HEAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={nodeData?.url || ''}
                  placeholder="https://example.com/api/${variable}"
                  onChange={(e) => update({ url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Use {'${variable}'} for interpolation
                </p>
              </div>

              {/* Headers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Headers</Label>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={addHeader}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                {headerEntries.length === 0 && (
                  <p className="text-xs text-muted-foreground">No headers configured</p>
                )}
                <div className="space-y-2">
                  {headerEntries.map(([key, value], i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Input
                        className="h-7 text-xs flex-1"
                        value={key}
                        placeholder="Key"
                        onChange={(e) => setHeader(key, e.target.value, value)}
                      />
                      <Input
                        className="h-7 text-xs flex-1"
                        value={value}
                        placeholder="Value"
                        onChange={(e) => setHeader(key, key, e.target.value)}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeHeader(key)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <textarea
                  id="body"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                  value={nodeData?.body || ''}
                  placeholder='{"key": "${variable}"}'
                  onChange={(e) => update({ body: e.target.value })}
                />
              </div>

              {/* Extract Rules */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Extract Variables</Label>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={addExtractRule}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                {extractRules.length === 0 && (
                  <p className="text-xs text-muted-foreground">No variables extracted</p>
                )}
                <div className="space-y-3">
                  {extractRules.map((rule, i) => (
                    <div key={i} className="space-y-1.5 p-2 rounded-md border border-border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Variable #{i + 1}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeExtractRule(i)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        className="h-7 text-xs"
                        value={rule.name}
                        placeholder="Variable name (e.g. authToken)"
                        onChange={(e) => setExtractRule(i, { name: e.target.value })}
                      />
                      <Select
                        value={rule.from}
                        onValueChange={(val) => setExtractRule(i, { from: val as 'BODY' | 'HEADER' })}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BODY">Response Body (gjson)</SelectItem>
                          <SelectItem value="HEADER">Response Header</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="h-7 text-xs font-mono"
                        value={rule.path}
                        placeholder={rule.from === 'BODY' ? 'e.g. data.token' : 'e.g. X-Request-Id'}
                        onChange={(e) => setExtractRule(i, { path: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {nodeType === 'delay' && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (ms)</Label>
              <Input
                id="duration"
                type="number"
                value={nodeData?.duration || ''}
                placeholder="1000"
                min={0}
                onChange={(e) => update({ duration: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Simulates user "think time" between actions
              </p>
            </div>
          )}

          {nodeType === 'check' && (
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Input
                id="condition"
                value={nodeData?.condition || ''}
                placeholder="Status code = 200"
                onChange={(e) => update({ condition: e.target.value })}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-border">
            <Button variant="destructive" className="w-full gap-2" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              Delete Node
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
