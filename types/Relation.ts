export interface Relation {
    id: string;
    type: 'flow' | 'or' | 'and' | 'in' | 'out';
    // Store handle information for each connection - this is the primary data
    connections: Array<{
        fromElementId: string;
        toElementId: string;
        sourceHandle?: string;
        targetHandle?: string;
    }>;
}