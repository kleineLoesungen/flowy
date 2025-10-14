import type { Element } from './Element'
import type { Relation } from './Relation'

export interface Flow {
    id: string;
    name: string;
    description: string | null;
    templateId: string;  // initial flow template
    elements: Element[];
    relations: Relation[];
    startingElementId: string;
    startedAt: string | null; // user input
    expectedEndDate: string | null; // generated based on durations
    completedAt: string | null; // real end date
    layout?: {
        [elementId: string]: {
            x: number;
            y: number;
        };
    };
}