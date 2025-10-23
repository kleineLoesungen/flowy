import type { ElementTemplate } from "./ElementTemplate";
import type { Relation } from "./Relation";

export interface FlowTemplate {
    id: string;
    name: string;
    description: string;
    elements: ElementTemplate[];
    relations: Relation[];
    startingElementId: string | null;
    layout?: {
        [elementId: string]: {
            x: number;
            y: number;
        };
    };
}