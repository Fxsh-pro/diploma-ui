import { Globe, Clock, CheckCircle, Play, Square } from "lucide-react";

export interface NodeType {
  id: string;
  type: 'http' | 'delay' | 'check' | 'start' | 'terminal';
  label: string;
  icon: any;
  category: 'request' | 'logic' | 'control' | 'system';
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
    id: 'start',
    type: 'start',
    label: 'Start',
    icon: Play,
    category: 'system',
    color: 'bg-success',
  },
  {
    id: 'terminal',
    type: 'terminal',
    label: 'End',
    icon: Square,
    category: 'system',
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
