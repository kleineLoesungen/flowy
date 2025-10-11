export interface Relation {
    id: string;
    fromElementIds: string[];
    toElementIds: string[];
    type: 'flow' | 'or' | 'and' | 'in' | 'out';
    // Enhanced to store handle information for each connection
    connections?: Array<{
        fromElementId: string;
        toElementId: string;
        sourceHandle?: string;
        targetHandle?: string;
    }>;
}