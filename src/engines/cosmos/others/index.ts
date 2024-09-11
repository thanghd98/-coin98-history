import { getInjHistory } from "./injective";

export const historyFactory: Record<string, any > = {
    injective: getInjHistory
}