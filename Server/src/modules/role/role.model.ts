export interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
