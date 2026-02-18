import { Response, NextFunction } from "express";
import { RequestWithUser } from "./authenticate";


export function authorize(roles: ("ADMIN" | "USER")[]) {
    return (req: RequestWithUser, res: Response, next: NextFunction): void => {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: { code: 401, message: "Unauthorized" } });
            return;
        }

        if (!roles.includes(user.role)) {
            res.status(403).json({ error: { code: 403, message: "Forbidden" } });
            return;
        }
        
        next();
    };
}
