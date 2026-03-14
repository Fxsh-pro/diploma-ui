import { http } from './client';
import type { AuditLogResponse, UserResponse } from './types';

export const usersApi = {
  list: () => http.get<UserResponse[]>('/api/users'),

  auditLog: (params: {
    limit?: number;
    offset?: number;
    entityType?: string;
    entityId?: string;
    actorId?: string;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.limit != null)     q.set('limit',      String(params.limit));
    if (params.offset != null)    q.set('offset',     String(params.offset));
    if (params.entityType)        q.set('entityType', params.entityType);
    if (params.entityId)          q.set('entityId',   params.entityId);
    if (params.actorId)           q.set('actorId',    params.actorId);
    const qs = q.toString();
    return http.get<AuditLogResponse[]>(`/api/users/audit-log${qs ? `?${qs}` : ''}`);
  },
};
