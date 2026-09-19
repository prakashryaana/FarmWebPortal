import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FarmNote, CreateFarmNoteDto, UpdateFarmNoteDto } from './farm-note';

@Injectable({
  providedIn: 'root'
})
export class FarmNoteService {
  private apiUrl = `${environment.baseApiUrl}api`;

  constructor(private http: HttpClient) {}

  /**
   * Fetches notes from FarmNotes collection for the given farmId using GET /api/FarmNote/farm/{farmId}
   */
  getFarmNotes(farmId: string): Observable<FarmNote[]> {
    if (!farmId) return of([]);
    const cleanFarmId = encodeURIComponent(farmId.trim());
    return this.http.get<FarmNote[]>(`${this.apiUrl}/FarmNote/farm/${cleanFarmId}`, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        console.warn(`[FarmNoteService] GET /api/FarmNote/farm/${cleanFarmId} failed:`, err);
        return of([]);
      })
    );
  }

  /**
   * Creates a new note in FarmNotes collection using POST /api/FarmNote/farm/{farmId}
   */
  createFarmNote(farmId: string, noteText: string): Observable<FarmNote> {
    const cleanFarmId = farmId.trim();
    const payload: CreateFarmNoteDto = {
      farmId: cleanFarmId,
      note: noteText.trim()
    };
    return this.http.post<FarmNote>(`${this.apiUrl}/FarmNote/farm/${encodeURIComponent(cleanFarmId)}`, payload, {
      withCredentials: true
    }).pipe(
      catchError(err => {
        // Fallback to standard POST /api/FarmNote if farm route fails
        return this.http.post<FarmNote>(`${this.apiUrl}/FarmNote`, payload, { withCredentials: true });
      })
    );
  }

  /**
   * Updates an existing note in FarmNotes collection using PUT /api/FarmNote/{noteId}
   */
  updateFarmNote(noteId: string, farmId: string, noteText: string): Observable<any> {
    const cleanNoteId = noteId.trim();
    const cleanFarmId = farmId.trim();
    const payload: UpdateFarmNoteDto = {
      farmId: cleanFarmId,
      note: noteText.trim()
    };
    return this.http.put(`${this.apiUrl}/FarmNote/${encodeURIComponent(cleanNoteId)}`, payload, {
      withCredentials: true,
      responseType: 'text' as 'json'
    }).pipe(
      catchError(() => {
        return this.http.put(`${this.apiUrl}/FarmNote/farm/${encodeURIComponent(cleanFarmId)}/${encodeURIComponent(cleanNoteId)}`, payload, {
          withCredentials: true,
          responseType: 'text' as 'json'
        });
      })
    );
  }

  /**
   * Deletes a note in FarmNotes collection using DELETE /api/FarmNote/{noteId}
   */
  deleteFarmNote(noteId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/FarmNote/${encodeURIComponent(noteId.trim())}`, {
      withCredentials: true,
      responseType: 'text' as 'json'
    });
  }

  /**
   * Saves list of notes (handles creating new notes, updating modified notes, and deleting removed notes)
   */
  saveFarmNotesList(
    farmId: string,
    currentItems: { noteId?: string; note: string }[],
    originalItems: FarmNote[]
  ): Observable<any> {
    if (!farmId) return of(null);

    const ops: Observable<any>[] = [];

    // 1. Deletions: original items whose noteId is not present in current valid items
    const currentNoteIds = new Set(
      currentItems
        .filter(item => !!item.noteId && item.note.trim().length > 0)
        .map(item => item.noteId!)
    );

    for (const orig of originalItems) {
      if (orig.noteId && !currentNoteIds.has(orig.noteId)) {
        ops.push(
          this.deleteFarmNote(orig.noteId).pipe(
            catchError(err => {
              console.warn('[FarmNoteService] Error deleting note:', orig.noteId, err);
              return of(null);
            })
          )
        );
      }
    }

    // 2. Creations & Updates
    for (const item of currentItems) {
      const trimmed = item.note.trim();
      if (!trimmed) continue;

      if (!item.noteId) {
        // New note -> Create
        ops.push(
          this.createFarmNote(farmId, trimmed).pipe(
            catchError(err => {
              console.warn('[FarmNoteService] Error creating note:', trimmed, err);
              return of(null);
            })
          )
        );
      } else {
        // Existing note -> check if changed
        const orig = originalItems.find(o => o.noteId === item.noteId);
        if (!orig || orig.note !== trimmed) {
          ops.push(
            this.updateFarmNote(item.noteId, farmId, trimmed).pipe(
              catchError(err => {
                console.warn('[FarmNoteService] Error updating note:', item.noteId, err);
                return of(null);
              })
            )
          );
        }
      }
    }

    if (ops.length === 0) {
      return of(null);
    }

    return forkJoin(ops);
  }
}
