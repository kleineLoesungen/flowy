import type { Element } from './Element'
import type { Relation } from './Relation'

export interface Flow {
    id: string;
    name: string;
    description: string | null;
    templateId: string;
    elements: Element[];
    relations: Relation[];
    startingElementIds: string[];
    startedAt: string | null;
    expectedEndDate: string | null;
    completedAt: string | null;
    layout?: {
        [elementId: string]: {
            x: number;
            y: number;
        };
    };
}