import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { templateService } from "../services/template.service";
import { azureBlobStorageService } from "../services/azure-blob-storage.service";
import multer from "multer";

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export class TemplateController {
  // GET /api/templates
  async getTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        categoryId,
        isPublic = "true",
        search,
        page = "1",
        limit = "20",
        orderBy = "createdAt",
        orderDirection = "desc",
      } = req.query;

      const result = await templateService.getTemplates({
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        isPublic: isPublic === "true",
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        orderBy: orderBy as "name" | "usageCount" | "createdAt",
        orderDirection: orderDirection as "asc" | "desc",
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  }

  // GET /api/templates/:id
  async getTemplateById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const template = await templateService.getTemplateById(parseInt(id));

      if (!template) {
        res.status(404).json({ error: "Template not found" });
        return;
      }

      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  }

  // GET /api/templates/slug/:slug
  async getTemplateBySlug(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const template = await templateService.getTemplateBySlug(slug);

      if (!template) {
        res.status(404).json({ error: "Template not found" });
        return;
      }

      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  }

  // POST /api/templates (Admin only)
  async createTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const { name, description, categoryId, funnelId, tags, isPublic } =
        req.body;

      if (!name || !categoryId || !funnelId) {
        res.status(400).json({
          error: "Missing required fields: name, categoryId, funnelId",
        });
        return;
      }

      const result = await templateService.createTemplateFromFunnel(userId, {
        name,
        description,
        categoryId: parseInt(categoryId),
        funnelId: parseInt(funnelId),
        tags: tags || [],
        isPublic: isPublic !== false,
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating template:", error);

      if (error instanceof Error) {
        if (error.message.includes("admin")) {
          res.status(403).json({ error: error.message });
          return;
        }
        if (error.message.includes("not found")) {
          res.status(404).json({ error: error.message });
          return;
        }
      }

      res.status(500).json({ error: "Failed to create template" });
    }
  }

  // POST /api/templates/:id/images (Admin only)
  async uploadTemplateImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const { id } = req.params;
      const { imageType = "preview", caption } = req.body;

      if (!req.file) {
        res.status(400).json({ error: "Image file is required" });
        return;
      }

      await templateService.addTemplateImage(
        parseInt(id),
        userId,
        req.file.buffer,
        {
          imageType,
          caption,
          contentType: req.file.mimetype,
        }
      );

      res.status(201).json({ message: "Image uploaded successfully" });
    } catch (error) {
      console.error("Error uploading template image:", error);

      if (error instanceof Error) {
        if (error.message.includes("admin")) {
          res.status(403).json({ error: error.message });
          return;
        }
        if (error.message.includes("not found")) {
          res.status(404).json({ error: error.message });
          return;
        }
      }

      res.status(500).json({ error: "Failed to upload image" });
    }
  }

  // GET /api/templates/categories
  async getTemplateCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
      const categories = await templateService.getTemplateCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching template categories:", error);
      res.status(500).json({ error: "Failed to fetch template categories" });
    }
  }



  // Middleware for image upload
  static uploadMiddleware = upload.single("image");
}

export const templateController = new TemplateController();
