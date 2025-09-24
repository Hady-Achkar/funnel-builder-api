import { v4 as uuidv4 } from "uuid";

export function buildAzurePath(userEmail: string): string {
  return `digitalsite/users/${userEmail}`;
}

export function generateUniqueFileName(fileExtension: string): string {
  const uuid = uuidv4();
  return `${uuid}${fileExtension}`;
}