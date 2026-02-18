import { Request, Response, NextFunction } from "express";
import { validateFirebaseToken } from "./firebase";
import prismaClient from "../prismaClient";


export interface RequestWithUser extends Request {
    user?: any;
};

export async function authenticate(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        const email = await validateFirebaseToken(authHeader);
        if (!email) {
            res.status(401).json({ error: { code: 401, message: "Invalid token" } });
            return;
        }

        const player = await prismaClient.player.findUnique({
            where: {
                email,
                deletedAt: null
            },
        });
        if (!player) {
            res.status(403).json({ error: { code: 403, message: "User not found" } });
            return;
        }

        req.user = player;
        
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({ error: { code: 500, message: "Internal server error" } });
        return;
    }
}

export async function registerAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    const email = await validateFirebaseToken(authHeader);
    if (!email) {
        res.status(401).json({ error: { code: 401, message: "Invalid token" } });
        return;
    }
    
    next();
}
