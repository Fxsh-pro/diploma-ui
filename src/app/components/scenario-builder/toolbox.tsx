import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { nodeTypes } from "./node-types";
import { cn } from "../ui/utils";
import { Search, Folder } from "lucide-react";
import { useState } from "react";

interface ToolboxProps {
  onNodeDragStart?: (nodeType: string) => void;
}

export function Toolbox({ onNodeDragStart }: ToolboxProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = nodeTypes.filter((node) =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = {
    request: filteredNodes.filter((n) => n.category === 'request'),
    logic: filteredNodes.filter((n) => n.category === 'logic'),
    control: filteredNodes.filter((n) => n.category === 'control'),
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Toolbox</CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search nodes..."
            className="h-8 pl-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
        {/* Request Nodes */}
        {categories.request.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <span>Request Nodes</span>
            </h4>
            <div className="space-y-1.5">
              {categories.request.map((node) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={() => onNodeDragStart?.(node.type)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border border-border bg-card cursor-move hover:bg-accent/50 transition-colors"
                    )}
                  >
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded text-white", node.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{node.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Logic Nodes */}
        {categories.logic.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Logic Nodes
            </h4>
            <div className="space-y-1.5">
              {categories.logic.map((node) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={() => onNodeDragStart?.(node.type)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border border-border bg-card cursor-move hover:bg-accent/50 transition-colors"
                    )}
                  >
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded text-white", node.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{node.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Control Nodes */}
        {categories.control.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Control Flow
            </h4>
            <div className="space-y-1.5">
              {categories.control.map((node) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={() => onNodeDragStart?.(node.type)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border border-border bg-card cursor-move hover:bg-accent/50 transition-colors"
                    )}
                  >
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded text-white", node.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{node.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Groups Section */}
        <div className="pt-2 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">
            Groups
          </h4>
          <div
            className="flex items-center gap-2 p-2 rounded-md border border-border bg-card cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded bg-muted">
              <Folder className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">New Group</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
