export interface FarmNote {
    id?: string;
    noteId: string;
    farmId: string;
    note: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateFarmNoteDto {
    noteId?: string;
    farmId: string;
    note: string;
    createdBy?: string;
}

export interface UpdateFarmNoteDto {
    farmId?: string;
    note?: string;
}
