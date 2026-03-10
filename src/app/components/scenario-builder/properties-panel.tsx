import { X, Trash2, Copy } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";

interface PropertiesPanelProps {
  nodeType: string;
  nodeData?: any;
  onClose: () => void;
  onUpdate?: (data: any) => void;
  onDelete?: () => void;
}

export function PropertiesPanel({ nodeType, nodeData, onClose, onUpdate, onDelete }: PropertiesPanelProps) {
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
              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select defaultValue={nodeData?.method || 'GET'}>
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  defaultValue={nodeData?.url || '/api/endpoint'}
                  placeholder="/api/endpoint"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Headers</Label>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    + Add Header
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <code className="flex-1 rounded bg-muted px-2 py-1.5">
                      Content-Type: application/json
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <code className="flex-1 rounded bg-muted px-2 py-1.5">
                      Authorization: Bearer {'{token}'}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Select defaultValue="none">
                  <SelectTrigger id="body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="form">Form Data</SelectItem>
                    <SelectItem value="raw">Raw</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Validations</Label>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    + Add Check
                  </Button>
                </div>
                <div className="space-y-2">
                  <Card>
                    <CardContent className="p-3 text-sm">
                      Status code equals 200
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-sm">
                      Response time &lt; 500ms
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Extract Variables</Label>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    + Add
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">productId</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="text-xs text-muted-foreground">
                        from $.data[0].id
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {nodeType === 'delay' && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                defaultValue={nodeData?.duration || 2}
                min={0}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Simulates user "think time" between actions
              </p>
            </div>
          )}

          {nodeType === 'check' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition Type</Label>
                <Select defaultValue="status">
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status Code</SelectItem>
                    <SelectItem value="response">Response Body</SelectItem>
                    <SelectItem value="header">Header Value</SelectItem>
                    <SelectItem value="time">Response Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="operator">Operator</Label>
                <Select defaultValue="equals">
                  <SelectTrigger id="operator">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="notEquals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greaterThan">Greater Than</SelectItem>
                    <SelectItem value="lessThan">Less Than</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Expected Value</Label>
                <Input id="value" defaultValue="200" />
              </div>
            </>
          )}

          {nodeType === 'split' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Define probability distribution for outgoing paths
              </p>
              <div className="space-y-2">
                <Label>Path A Weight</Label>
                <Input type="number" defaultValue={60} min={0} max={100} />
              </div>
              <div className="space-y-2">
                <Label>Path B Weight</Label>
                <Input type="number" defaultValue={30} min={0} max={100} />
              </div>
              <div className="space-y-2">
                <Label>Path C Weight</Label>
                <Input type="number" defaultValue={10} min={0} max={100} />
              </div>
              <Button variant="outline" size="sm" className="w-full">
                + Add Path
              </Button>
            </div>
          )}

          {nodeType === 'loop' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="iterations">Max Iterations</Label>
                <Input
                  id="iterations"
                  type="number"
                  defaultValue={nodeData?.iterations || 5}
                  min={1}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loopCondition">Loop Condition</Label>
                <Select defaultValue="fixed">
                  <SelectTrigger id="loopCondition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Count</SelectItem>
                    <SelectItem value="while">While Condition</SelectItem>
                    <SelectItem value="until">Until Condition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-border flex gap-2">
            <Button variant="outline" className="flex-1 gap-2">
              <Copy className="h-4 w-4" />
              Duplicate
            </Button>
            <Button variant="destructive" className="flex-1 gap-2" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
