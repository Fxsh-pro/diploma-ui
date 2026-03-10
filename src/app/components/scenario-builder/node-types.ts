import { Globe, Clock, CheckCircle, Database, GitBranch, RotateCw } from "lucide-react";

export interface NodeType {
  id: string;
  type: 'http' | 'delay' | 'check' | 'data' | 'split' | 'loop' | 'start';
  label: string;
  icon: any;
  category: 'request' | 'logic' | 'control';
  color: string;
}

export const nodeTypes: NodeType[] = [
  {
    id: 'http',
    type: 'http',
    label: 'HTTP Request',
    icon: Globe,
    category: 'request',
    color: 'bg-primary',
  },
  {
    id: 'delay',
    type: 'delay',
    label: 'Think Time',
    icon: Clock,
    category: 'control',
    color: 'bg-secondary',
  },
  {
    id: 'check',
    type: 'check',
    label: 'Validation',
    icon: CheckCircle,
    category: 'logic',
    color: 'bg-success',
  },
  {
    id: 'data',
    type: 'data',
    label: 'Extract Data',
    icon: Database,
    category: 'logic',
    color: 'bg-accent',
  },
  {
    id: 'split',
    type: 'split',
    label: 'Split Path',
    icon: GitBranch,
    category: 'control',
    color: 'bg-warning',
  },
  {
    id: 'loop',
    type: 'loop',
    label: 'Loop',
    icon: RotateCw,
    category: 'control',
    color: 'bg-destructive',
  },
];

export interface ScenarioNode {
  id: string;
  type: NodeType['type'];
  x: number;
  y: number;
  data: any;
}

export interface NodeConnection {
  id: string;
  from: string;
  to: string;
  weight?: number;
  label?: string;
}
