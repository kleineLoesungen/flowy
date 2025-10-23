import type { Element } from './Element'
import type { Relation } from './Relation'

export interface Flow {
    id: string;
    name: string;
    description: string | null;
    templateId: string;  // initial flow template
    elements: Element[]; // must have at least one element
    relations: Relation[];
    startingElementId: string; // first element to start the flow and must be set
    startedAt: string | null; // user input
    expectedEndDate: string | null; // generated based on durations
    completedAt: string | null; // real end date
    hidden: boolean; // if true, the flow is hidden for not assigned users (admins can still see it); default is false
    layout?: {
        [elementId: string]: {
            x: number;
            y: number;
        };
    };
}