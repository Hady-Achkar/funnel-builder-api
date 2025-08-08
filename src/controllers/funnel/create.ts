import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../../services/funnel";

export const createFunnel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }
    const { status } = req.body;
    
    // Default name: "08.01.2025 14:30" format if not provided
    const name = req.body.name || new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');

    const funnel = await FunnelService.createFunnel(userId, { name, status });
    
    res.status(201).json({
      success: true,
      id: funnel.id,
      message: funnel.message
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to create funnel"
    });
  }
};