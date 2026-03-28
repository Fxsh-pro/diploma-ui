import { http } from './client';
import type { SwaggerSpecResponse, CreateSwaggerSpecRequest } from './types';

export const swaggerSpecsApi = {
  list: () => http.get<SwaggerSpecResponse[]>('/api/swagger-specs'),
  create: (body: CreateSwaggerSpecRequest) => http.post<SwaggerSpecResponse>('/api/swagger-specs', body),
  delete: (id: string) => http.delete<void>(`/api/swagger-specs/${id}`),
};
