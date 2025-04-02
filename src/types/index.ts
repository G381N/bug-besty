export interface IVulnerability {
  _id?: string;
  status: 'Not Yet Done' | 'Found' | 'Not Found';
  subdomainId: string;
  type?: string;
  notes?: string;
}

export interface ISubdomain {
  _id?: string;
  name: string;
  status: 'pending' | 'completed';
  projectId: string;
}

export interface IProject {
  _id?: string;
  name: string;
  description?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  _id?: string;
  email: string;
  password?: string;
  name?: string;
}

export type ApiError = {
  error: string;
  status?: number;
} 