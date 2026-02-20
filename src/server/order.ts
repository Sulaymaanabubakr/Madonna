import { randomUUID } from "crypto";

export const createOrderNumber = () => `MLX-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
