export interface Relation {
    id: string;
    fromElementIds: string[];
    toElementIds: string[];
    type: 'flow' | 'or' | 'and' | 'in' | 'out';
}