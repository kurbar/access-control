export interface IRole {
  id: string;
  grants: { resource: string, action: string[], attributes: string[] }[]
}

