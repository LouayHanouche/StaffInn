export type UserRole = 'HOTEL' | 'CANDIDATE' | 'ADMIN';

export type JobOfferStatus = 'PENDING' | 'ACTIVE' | 'CLOSED';

export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';

export interface TokenPayload {
  sub: string;
  role: UserRole;
  email: string;
  sessionId: string;
}

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface SearchFilterInput extends PaginationInput {
  skills?: string[];
  experienceMin?: number;
  position?: string;
}
