import { BadRequestError } from "../../../../errors/http-errors";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageFile(file: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestError("No file provided");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestError(
      `Invalid file type: ${file.mimetype}. Only image files are allowed.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestError("File exceeds 5MB limit.");
  }
}

export function getFileExtension(originalname: string): string {
  const extension = path.extname(originalname);
  return extension || ".jpg"; // fallback to .jpg
}