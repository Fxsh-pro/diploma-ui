import { Globe, Clock, CheckCircle, Play, Square, Shuffle } from "lucide-react";

export interface NodeType {
  id: string;
  type: 'http' | 'delay' | 'check' | 'generate' | 'start' | 'terminal';
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
    id: 'generate',
    type: 'generate',
    label: 'Generate Data',
    icon: Shuffle,
    category: 'logic',
    color: 'bg-warning',
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

export type CheckOp = 'EQ' | 'NE' | 'LT' | 'LE' | 'GT' | 'GE' | 'CONTAINS' | 'NOT_CONTAINS' | 'EXISTS';

export interface CheckRule {
  variable: string;
  op: CheckOp;
  value?: string;
}

export interface GenerateRule {
  name: string;
  type: 'UUID' | 'EMAIL' | 'TIMESTAMP' | 'RANDOM_INT' | 'RANDOM_STRING';
  min?: number;
  max?: number;
  length?: number;
}

export interface ScenarioNode {
  id: string;
  type: NodeType['type'];
  x: number;
  y: number;
  data: any;
}

export type EdgeCondition = 'ANY' | 'PASS' | 'FAIL';

export interface NodeConnection {
  id: string;
  from: string;
  to: string;
  weight?: number;
  condition?: EdgeCondition;
  label?: string;
}
