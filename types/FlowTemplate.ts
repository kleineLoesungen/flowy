import type { ElementTemplate } from "./ElementTemplate";
import type { Relation } from "./Relation";

export interface FlowTemplate {
    id: string;
    name: string;
    description: string;
    elements: ElementTemplate[];
    relations: Relation[];
    startingElementIds: string[];
    layout?: {
        [elementId: string]: {
            x: number;
            y: number;
        };
    };
}