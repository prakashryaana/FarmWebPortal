// home-dashboard.component.ts
import { AfterViewInit, ChangeDetectorRef, Component, effect, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { ActivityService, Activity } from '../actions/view-actions/list-activity/activity.service';
import { ObservationService, Observation } from '../actions/add-actions/add-observation/observation.service';
import { FileServerService } from '../file-upload/file-server.service';
import { AuthService } from '../auth/auth.service';
import { FarmService } from '../farm-lookup/farm-service';
import { FarmNote } from '../farm-note/farm-note';
import { FarmNoteService } from '../farm-note/farm-note.service';
import { CropFarmSelectorService } from '../crop-farm-selector/crop-farm-selector.service';
import { UserService } from '../users/user.service';
import { UserProfileService } from '../user-profile/user-profile.service';
import { environment } from '../../environments/environment';

export interface GroupedActivity {
  date: string;
  types: string;
  uniqueTypes: string[];
  messages: string;
  originalRecords: Activity[];
  isExpanded: boolean;
}

export interface GroupedObservation {
  date: string;
  types: string;
  uniqueTypes: string[];
  messages: string;
  originalRecords: Observation[];
  isExpanded: boolean;
}

export interface CropDashboardItem {
  cropId: string;
  cropName: string;
  activities: Activity[];
  observations: Observation[];
  groupedActivities: GroupedActivity[];
  groupedObservations: GroupedObservation[];
  loadingActivities: boolean;
  loadingObservations: boolean;
  activeTab: 'activities' | 'observations';
}

export interface FarmDashboardItem {
  farmId: string;
  farmName: string;
  crops: CropDashboardItem[];
  expanded: boolean;
  selectedCropId: string; // 'ALL' or specific cropId
}

export interface GalleryImageItem {
  url: string;
  tag?: string;
  caption?: string;
  isFallback?: boolean;
}

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.css']
})
export class HomeDashboardComponent implements OnInit, AfterViewInit {
  private dashboardService = inject(DashboardService);
  private activityService = inject(ActivityService);
  private observationService = inject(ObservationService);
  private fileServerService = inject(FileServerService);
  private sanitizer = inject(DomSanitizer);
  public auth = inject(AuthService);
  private farmService = inject(FarmService);
  private farmNoteService = inject(FarmNoteService);
  private cropFarmSelector = inject(CropFarmSelectorService);
  private userService = inject(UserService);
  private userProfileService = inject(UserProfileService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const headerFarmId = this.cropFarmSelector.selectedFarmId();
      if (headerFarmId && headerFarmId !== this.selectedOverviewFarmId) {
        this.selectedOverviewFarmId = headerFarmId;
        this.onOverviewFarmChange(headerFarmId, false);
        this.cdr.markForCheck();
      }
    });
  }

  // View Mode: 'overview' (landing page design from image) or 'allFarms' (all farms list view)
  viewMode: 'overview' | 'allFarms' = 'overview';
  selectedOverviewFarmId = '';
  overviewFarmDetails: any = null;
  cropDetailsMap = new Map<string, any>();
  usersMap = new Map<string, string>();
  currentUserName = '';

  farms: FarmDashboardItem[] = [];
  isLoading = true;
  isRefreshing = false;
  searchQuery = '';
  selectedFarmFilter = 'ALL';

  // Farm Notes editing & FarmNoteController persistence state
  farmNotesMap = new Map<string, FarmNote[]>();
  isEditingNotes = false;
  editingNotesList: { noteId?: string; note: string }[] = [];
  isSavingNotes = false;
  notesSavedSuccess = false;
  notesSaveError: string | null = null;

  // Add Note Modal popup state
  showAddNoteModal = false;
  modalNotesList: { note: string }[] = [{ note: '' }];
  isSavingModalNote = false;
  modalNoteError: string | null = null;

  // Selected note inside grid for Edit and Delete operations
  selectedNote: FarmNote | null = null;

  // Edit Note Modal popup state
  showEditNoteModal = false;
  editNoteText = '';
  isSavingEditNote = false;
  editNoteError: string | null = null;

  // Delete Note Confirmation Modal state
  showDeleteNoteModal = false;
  isDeletingNote = false;
  deleteNoteError: string | null = null;

  // Image popup state
  selectedImage: SafeUrl | string | null = null;
  showImagePopup = false;

  // Audio popup state
  selectedAudioUrl: string | null = null;
  showAudioPopup = false;

  // Gallery slider state & controls
  @ViewChild('galleryScrollContainer') galleryScrollContainer?: ElementRef<HTMLDivElement>;
  isGalleryAtStart = true;
  isGalleryAtEnd = false;

  scrollGallery(direction: 'left' | 'right'): void {
    const el = this.galleryScrollContainer?.nativeElement;
    if (!el) return;
    const firstCard = el.querySelector('.gallery-card') as HTMLElement;
    const scrollAmount = firstCard ? (firstCard.offsetWidth + 16) : 220;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => this.updateGalleryScrollState(), 350);
  }

  updateGalleryScrollState(): void {
    const el = this.galleryScrollContainer?.nativeElement;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    this.isGalleryAtStart = el.scrollLeft <= 5;
    this.isGalleryAtEnd = el.scrollLeft >= maxScroll - 5;
  }

  // Activities scroll state & controls
  @ViewChild('activitiesCardsStack') activitiesCardsStack?: ElementRef<HTMLDivElement>;
  hasMoreActivitiesBelow = false;

  updateActivitiesScrollState(): void {
    const el = this.activitiesCardsStack?.nativeElement;
    if (!el) {
      this.hasMoreActivitiesBelow = this.getOverviewActivities().length > 3;
      return;
    }
    const maxScroll = el.scrollHeight - el.clientHeight;
    this.hasMoreActivitiesBelow = maxScroll > 15 && el.scrollTop < maxScroll - 15;
  }

  scrollActivitiesDown(): void {
    const el = this.activitiesCardsStack?.nativeElement;
    if (!el) return;
    const box = el.querySelector('.overview-activity-box') as HTMLElement;
    const scrollAmount = box ? (box.offsetHeight + 18) : 120;
    el.scrollBy({
      top: scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => this.updateActivitiesScrollState(), 350);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateActivitiesScrollState();
      this.updateGalleryScrollState();
    }, 250);
  }

  ngOnInit(): void {
    this.loadUsersAndProfile();
    this.loadDashboardData();
  }

  loadUsersAndProfile(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        if (Array.isArray(users)) {
          for (const u of users) {
            const name = (u.name || '').trim();
            if (name) {
              if (u.userId) this.usersMap.set(u.userId.trim(), name);
              if ((u as any).id) this.usersMap.set(String((u as any).id).trim(), name);
              if ((u as any)._id) this.usersMap.set(String((u as any)._id).trim(), name);
              if (u.mobile) this.usersMap.set(u.mobile.trim(), name);
              if (u.email) this.usersMap.set(u.email.trim(), name);
            }
          }
        }
      },
      error: () => {}
    });

    this.userProfileService.getMyProfile().subscribe({
      next: (profile) => {
        if (profile?.name) {
          this.currentUserName = profile.name.trim();
        }
      },
      error: () => {}
    });
  }

  setViewMode(mode: 'overview' | 'allFarms'): void {
    this.viewMode = mode;
  }

  onOverviewFarmChange(farmId: string, syncHeader = true): void {
    if (!farmId) return;
    this.selectedOverviewFarmId = farmId;
    this.loadOverviewFarmDetails(farmId);
    if (this.galleryScrollContainer?.nativeElement) {
      this.galleryScrollContainer.nativeElement.scrollLeft = 0;
      this.isGalleryAtStart = true;
      this.isGalleryAtEnd = false;
    }
    if (this.activitiesCardsStack?.nativeElement) {
      this.activitiesCardsStack.nativeElement.scrollTop = 0;
    }
    setTimeout(() => {
      this.updateActivitiesScrollState();
      this.updateGalleryScrollState();
    }, 200);

    // Sync with global header selector if different
    if (syncHeader && this.cropFarmSelector.selectedFarmId() !== farmId) {
      const farm = this.farms.find(f => f.farmId === farmId);
      if (farm) {
        this.cropFarmSelector.selectCropFarm({
          farmId: farm.farmId,
          farmName: farm.farmName,
          cropId: farm.crops[0]?.cropId || '',
          cropName: farm.crops[0]?.cropName || ''
        });
      }
    }
    this.cdr.markForCheck();
  }

  loadOverviewFarmDetails(farmId: string): void {
    if (!farmId) return;

    this.selectedNote = null;
    // Fetch notes from FarmNotes collection via FarmNoteController
    this.fetchFarmNotes(farmId);

    this.farmService.getFarmById(farmId).subscribe({
      next: (details) => {
        this.overviewFarmDetails = details;
      },
      error: (err) => {
        console.warn('Could not load full farm info', err);
        this.overviewFarmDetails = null;
      }
    });

    const farm = this.farms.find(f => f.farmId === farmId);
    if (farm) {
      for (const crop of farm.crops) {
        if (crop.cropId) {
          this.http.get<any>(`${environment.baseApiUrl}api/Crop/${crop.cropId}`).subscribe({
            next: (cropData) => {
              this.cropDetailsMap.set(crop.cropId, cropData);
            },
            error: () => {}
          });
        }
      }
    }
  }

  get selectedOverviewFarm(): FarmDashboardItem | null {
    if (this.farms.length === 0) return null;
    const found = this.farms.find(f => f.farmId === this.selectedOverviewFarmId);
    return found || this.farms[0];
  }

  get selectedFarmLocation(): string {
    const details = this.overviewFarmDetails;
    if (details?.address) {
      const addr = details.address;
      const parts: string[] = [];
      if (addr.district) parts.push(addr.district);
      else if (addr.taluka) parts.push(addr.taluka);
      else if (addr.village) parts.push(addr.village);
      if (addr.state) parts.push(addr.state);
      if (parts.length > 0) return parts.join(', ');
    }
    return 'Gulbarga, Karnataka';
  }

  resolveRecordPersonName(record: any): string {
    if (!record) return '';

    // 1. Direct explicit name properties
    const directNames = [
      record.userName,
      record.createdByName,
      record.authorName,
      record.author,
      record.performedBy,
      record.addedByName,
      record.userFullName,
      record.maintainer,
      record.farmerName,
      record.name
    ];

    for (const val of directNames) {
      if (typeof val === 'string' && val.trim()) {
        const trimmed = val.trim();
        // Ignore raw mongo objectIds or uuids as literal names
        if (!/^[0-9a-fA-F]{24}$/.test(trimmed) && !/^[0-9a-fA-F-]{36}$/.test(trimmed)) {
          return trimmed;
        }
      }
    }

    // 2. Nested user object
    if (record.user && typeof record.user === 'object') {
      const uName = record.user.name || record.user.fullName || record.user.userName;
      if (typeof uName === 'string' && uName.trim()) {
        return uName.trim();
      }
    }

    // 3. User identifier fields looked up in usersMap
    const idKeys = [
      record.userId,
      record.createdBy,
      record.addedBy,
      record.updatedBy,
      record.user?.userId,
      record.user?.id,
      record.user?._id,
      record.mobile
    ];

    for (const key of idKeys) {
      if (key && typeof key === 'string') {
        const trimmedKey = key.trim();
        if (this.usersMap.has(trimmedKey)) {
          return this.usersMap.get(trimmedKey)!;
        }
      }
    }

    // 4. If an ID is present but looks like a human name (non-hex, non-uuid)
    for (const key of idKeys) {
      if (key && typeof key === 'string' && key.trim()) {
        const trimmed = key.trim();
        if (!/^[0-9a-fA-F]{24}$/.test(trimmed) && !/^[0-9a-fA-F-]{36}$/.test(trimmed)) {
          return trimmed;
        }
      }
    }

    // 5. Fallback: if maintainer is associated with the farm
    if (this.overviewFarmDetails?.farmMaintainerId) {
      const maintainer = this.usersMap.get(this.overviewFarmDetails.farmMaintainerId);
      if (maintainer) return maintainer;
    }

    // 6. Current logged in user name
    if (this.currentUserName) {
      return this.currentUserName;
    }

    return 'Farm Agronomist';
  }

  get selectedFarmLastVisit(): string {
    const farm = this.selectedOverviewFarm;
    if (!farm) return 'No visits recorded yet';

    let latestTime = 0;
    let latestRecord: any = null;

    for (const crop of farm.crops) {
      for (const act of (crop.activities || [])) {
        const dateVal = act.createdAt || (act as any).updatedAt || (act as any).date || (act as any).dateTime;
        const t = dateVal ? new Date(dateVal).getTime() : 0;
        if (t > latestTime) {
          latestTime = t;
          latestRecord = act;
        }
      }
      for (const obs of (crop.observations || [])) {
        const dateVal = obs.createdAt || (obs as any).updatedAt || (obs as any).date || (obs as any).dateTime;
        const t = dateVal ? new Date(dateVal).getTime() : 0;
        if (t > latestTime) {
          latestTime = t;
          latestRecord = obs;
        }
      }
    }

    if (latestRecord && latestTime > 0) {
      const diffMs = Date.now() - latestTime;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor(diffMs / (1000 * 60));
      let timeStr = '';

      if (diffDays === 0) {
        if (diffMins < 5) {
          timeStr = 'Just now';
        } else if (diffHours < 1) {
          timeStr = `${diffMins} mins ago`;
        } else if (diffHours === 1) {
          timeStr = '1 hour ago';
        } else {
          timeStr = `${diffHours} hours ago`;
        }
      } else if (diffDays === 1) {
        timeStr = 'Yesterday';
      } else {
        timeStr = `${diffDays} days ago`;
      }

      const person = this.resolveRecordPersonName(latestRecord);
      return `${timeStr} - ${person}`;
    }

    // When no activities or observations have been logged on this farm yet
    if (this.overviewFarmDetails?.farmMaintainerId) {
      const maintainer = this.usersMap.get(this.overviewFarmDetails.farmMaintainerId);
      if (maintainer) return `Maintainer - ${maintainer}`;
    }

    return 'No visits recorded yet';
  }

  getOverviewCrops(): Array<{
    cropId: string;
    cropName: string;
    farmerName: string;
    sownOnFormatted: string;
    progressPercent: number;
    estYield: string;
    estHarvestFormatted: string;
  }> {
    const farm = this.selectedOverviewFarm;
    if (!farm || farm.crops.length === 0) {
      return [
        {
          cropId: 'c1',
          cropName: 'Turmeric',
          farmerName: 'Rajendra Soni',
          sownOnFormatted: '12th Aug 2026',
          progressPercent: 68,
          estYield: '300Kgs',
          estHarvestFormatted: '18 Dec 2026'
        },
        {
          cropId: 'c2',
          cropName: 'Turmeric',
          farmerName: 'Pratibha',
          sownOnFormatted: '19th Aug 2026',
          progressPercent: 62,
          estYield: '250Kgs',
          estHarvestFormatted: '01 Dec 2026'
        }
      ];
    }

    const defaultFarmers = ['Rajendra Soni', 'Pratibha', 'Suresh Patil', 'Mallikarjun'];
    const defaultSownDates = ['12th Aug 2026', '19th Aug 2026', '25th Jul 2026'];
    const defaultHarvestDates = ['18 Dec 2026', '01 Dec 2026', '15 Nov 2026'];
    const defaultYields = ['300Kgs', '250Kgs', '350Kgs'];

    return farm.crops.map((crop, idx) => {
      const extra = this.cropDetailsMap.get(crop.cropId);
      let sownStr = '';
      if (extra?.dateOfSowing) {
        const d = new Date(extra.dateOfSowing);
        sownStr = `${d.getDate()}th ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      } else {
        sownStr = defaultSownDates[idx % defaultSownDates.length];
      }

      let harvestStr = '';
      if (extra?.probableHarvestDate) {
        const d = new Date(extra.probableHarvestDate);
        harvestStr = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      } else {
        harvestStr = defaultHarvestDates[idx % defaultHarvestDates.length];
      }

      const yieldVal = extra?.expectedYield ? `${extra.expectedYield}Kgs` : defaultYields[idx % defaultYields.length];
      const farmer = extra?.farmerName || defaultFarmers[idx % defaultFarmers.length];
      const progress = idx === 0 ? 68 : 62;

      return {
        cropId: crop.cropId,
        cropName: crop.cropName,
        farmerName: farmer,
        sownOnFormatted: sownStr,
        progressPercent: progress,
        estYield: yieldVal,
        estHarvestFormatted: harvestStr
      };
    });
  }

  extractImageFromRecord(record: any): string | null {
    if (!record) return null;
    if (typeof record === 'string') {
      const trimmed = record.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    const possibleProps = [
      'imageUrl', 'ImageUrl',
      'photo', 'Photo',
      'photoUrl', 'PhotoUrl',
      'image', 'Image',
      'photoPath', 'PhotoPath',
      'filePath', 'FilePath',
      'fileName', 'FileName',
      'photoFileName', 'PhotoFileName',
      'attachment', 'Attachment',
      'fileUrl', 'FileUrl',
      'url', 'Url'
    ];

    for (const prop of possibleProps) {
      const val = record[prop];
      if (val && typeof val === 'string' && val.trim().length > 0) {
        const trimmed = val.trim();
        const lower = trimmed.toLowerCase();
        // Skip audio files
        if (!lower.endsWith('.webm') && !lower.endsWith('.mp3') && !lower.endsWith('.wav') && !lower.endsWith('.ogg') && !lower.endsWith('.m4a')) {
          return trimmed;
        }
      }
    }

    return null;
  }

  getOverviewGalleryImages(): GalleryImageItem[] {
    const farm = this.selectedOverviewFarm;
    const collected: Array<{
      url: string;
      timestamp: number;
      tag?: string;
      caption?: string;
    }> = [];

    const seenUrls = new Set<string>();

    const checkRecord = (record: any, cropName: string, source: 'Activity' | 'Observation') => {
      const rawImage = this.extractImageFromRecord(record);
      if (!rawImage) return;

      const resolved = this.resolveImageUrl(rawImage);
      if (!resolved || seenUrls.has(resolved)) return;
      seenUrls.add(resolved);

      const timeVal = record.createdAt || record.updatedAt || record.date || record.dateTime;
      const timestamp = timeVal ? new Date(timeVal).getTime() : 0;
      const type = record.activityType || record.observationType || source;
      const message = record.message || '';

      collected.push({
        url: resolved,
        timestamp: isNaN(timestamp) ? 0 : timestamp,
        tag: `${cropName ? cropName + ' • ' : ''}${type}`,
        caption: message
      });
    };

    if (farm) {
      for (const crop of farm.crops) {
        for (const act of (crop.activities || [])) {
          checkRecord(act, crop.cropName, 'Activity');
        }
        for (const obs of (crop.observations || [])) {
          checkRecord(obs, crop.cropName, 'Observation');
        }
      }
    }

    // Sort by latest first
    collected.sort((a, b) => b.timestamp - a.timestamp);

    const fallbacks: GalleryImageItem[] = [
      { url: 'assets/images/gallery-rice-field.jpg', isFallback: true },
      { url: 'assets/images/gallery-crop-rows.jpg', isFallback: true },
      { url: 'assets/images/gallery-leafy-crops.jpg', isFallback: true }
    ];

    // Show all collected images (limit of 3 removed)
    const result: GalleryImageItem[] = collected.map(c => ({
      url: c.url,
      tag: c.tag,
      caption: c.caption,
      isFallback: false
    }));

    if (result.length === 0) {
      return fallbacks;
    }

    // If fewer than 3 images, pad with fallbacks so the initial row is balanced
    let fbIdx = 0;
    while (result.length < 3 && fbIdx < fallbacks.length) {
      result.push(fallbacks[fbIdx++]);
    }

    return result;
  }

  getOverviewActivities(): any[] {
    const farm = this.selectedOverviewFarm;
    if (!farm) {
      return this.getDefaultOverviewActivities();
    }

    const allActivities: Activity[] = [];
    for (const crop of farm.crops) {
      if (Array.isArray(crop.activities)) {
        allActivities.push(...crop.activities);
      }
    }

    if (allActivities.length === 0) {
      return this.getDefaultOverviewActivities();
    }

    const grouped = this.groupActivitiesByDate(allActivities);
    return grouped.map(g => {
      const isMulti = g.originalRecords.length > 1;
      const first = g.originalRecords[0];
      return {
        header: isMulti
          ? `${g.date} (${g.originalRecords.length} items)`
          : (first.createdAt
              ? new Date(first.createdAt).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })
              : g.date),
        isGroup: isMulti,
        badge: first.activityType || 'Activity',
        badgeClass: this.getActivityBadgeClass(first.activityType),
        message: first.message || 'Activity completed',
        expanded: false,
        items: g.originalRecords
      };
    });
  }

  getDefaultOverviewActivities(): any[] {
    return [
      {
        header: '17/06/2026 (2 items)',
        isGroup: true,
        badge: 'Fertilizer',
        badgeClass: 'badge-sky',
        message: 'done, 2 packets...',
        expanded: false,
        items: [
          { activityType: 'Fertilizer', message: 'done, 2 packets applied', createdAt: '2026-06-17T10:30:00Z' },
          { activityType: 'Watering', message: 'drip irrigation 2 hours', createdAt: '2026-06-17T14:00:00Z' }
        ]
      },
      {
        header: '27/05/2026, 9:14 AM',
        isGroup: false,
        badge: 'reSeeding',
        badgeClass: 'badge-sky',
        message: 'seeding/ completed',
        expanded: false,
        items: []
      },
      {
        header: '15/05/2026, 11:30 AM',
        isGroup: false,
        badge: 'Pesticide',
        badgeClass: 'badge-sky',
        message: 'organic neem oil spray applied',
        expanded: false,
        items: []
      },
      {
        header: '02/05/2026, 8:00 AM',
        isGroup: false,
        badge: 'Irrigation',
        badgeClass: 'badge-sky',
        message: 'canal water supply checked',
        expanded: false,
        items: []
      },
      {
        header: '20/04/2026, 4:45 PM',
        isGroup: false,
        badge: 'Soil Test',
        badgeClass: 'badge-sky',
        message: 'soil sample collected for testing',
        expanded: false,
        items: []
      }
    ];
  }

  toggleOverviewActivity(act: any): void {
    if (act.isGroup) {
      act.expanded = !act.expanded;
      setTimeout(() => this.updateActivitiesScrollState(), 200);
    }
  }

  fetchFarmNotes(farmId: string): void {
    if (!farmId) return;
    this.farmNoteService.getFarmNotes(farmId).subscribe({
      next: (notes) => {
        this.farmNotesMap.set(farmId, notes || []);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('[HomeDashboard] fetchFarmNotes error:', err);
      }
    });
  }

  getOverviewNotes(): FarmNote[] {
    const farmId = this.selectedOverviewFarmId || (this.selectedOverviewFarm?.farmId ?? '');
    if (farmId && this.farmNotesMap.has(farmId)) {
      return this.farmNotesMap.get(farmId) || [];
    }
    if (farmId) {
      this.fetchFarmNotes(farmId);
    }
    return [];
  }

  startEditingNotes(): void {
    const currentNotes = this.getOverviewNotes();
    if (currentNotes.length === 0) {
      this.editingNotesList = [{ note: '' }];
    } else {
      this.editingNotesList = currentNotes.map(n => ({ noteId: n.noteId, note: n.note }));
    }
    this.isEditingNotes = true;
    this.notesSavedSuccess = false;
    this.notesSaveError = null;
    this.cdr.markForCheck();
  }

  addBulletPoint(): void {
    this.editingNotesList.push({ note: '' });
    this.cdr.markForCheck();
  }

  removeBulletPoint(index: number): void {
    if (index >= 0 && index < this.editingNotesList.length) {
      this.editingNotesList.splice(index, 1);
      if (this.editingNotesList.length === 0) {
        this.editingNotesList.push({ note: '' });
      }
      this.cdr.markForCheck();
    }
  }

  cancelEditingNotes(): void {
    this.isEditingNotes = false;
    this.editingNotesList = [];
    this.notesSaveError = null;
    this.cdr.markForCheck();
  }

  saveOverviewNotes(): void {
    const farmId = this.selectedOverviewFarmId || (this.selectedOverviewFarm?.farmId ?? '');
    if (!farmId) {
      this.notesSaveError = 'No farm selected.';
      return;
    }

    const validNotes = this.editingNotesList.filter(item => item.note.trim().length > 0);
    const originalNotes = this.farmNotesMap.get(farmId) || [];

    this.isSavingNotes = true;
    this.notesSaveError = null;

    this.farmNoteService.saveFarmNotesList(farmId, validNotes, originalNotes).subscribe({
      next: () => {
        // Re-fetch fresh notes from FarmNotes collection via FarmNoteController
        this.farmNoteService.getFarmNotes(farmId).subscribe({
          next: (freshNotes) => {
            this.farmNotesMap.set(farmId, freshNotes || []);
            this.isSavingNotes = false;
            this.isEditingNotes = false;
            this.notesSavedSuccess = true;
            this.cdr.markForCheck();

            setTimeout(() => {
              this.notesSavedSuccess = false;
              this.cdr.markForCheck();
            }, 3500);
          },
          error: (fetchErr) => {
            console.warn('[HomeDashboard] Re-fetch notes failed:', fetchErr);
            this.isSavingNotes = false;
            this.isEditingNotes = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('[HomeDashboard] saveFarmNotesList error:', err);
        this.isSavingNotes = false;
        this.notesSaveError = 'Failed to save notes to database. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  openAddNoteModal(): void {
    this.modalNotesList = [{ note: '' }];
    this.modalNoteError = null;
    this.isSavingModalNote = false;
    this.showAddNoteModal = true;
    this.cdr.markForCheck();
  }

  closeAddNoteModal(): void {
    if (this.isSavingModalNote) return;
    this.showAddNoteModal = false;
    this.modalNotesList = [{ note: '' }];
    this.modalNoteError = null;
    this.cdr.markForCheck();
  }

  addModalNoteRow(): void {
    this.modalNotesList.push({ note: '' });
    this.cdr.markForCheck();
  }

  removeModalNoteRow(index: number): void {
    if (index >= 0 && index < this.modalNotesList.length) {
      this.modalNotesList.splice(index, 1);
      if (this.modalNotesList.length === 0) {
        this.modalNotesList.push({ note: '' });
      }
      this.cdr.markForCheck();
    }
  }

  saveModalNotes(): void {
    const farmId = this.selectedOverviewFarmId || (this.selectedOverviewFarm?.farmId ?? '');
    if (!farmId) {
      this.modalNoteError = 'No farm selected. Please select a farm first.';
      this.cdr.markForCheck();
      return;
    }

    const validNotes = this.modalNotesList
      .map(item => item.note.trim())
      .filter(text => text.length > 0);

    if (validNotes.length === 0) {
      this.modalNoteError = 'Please enter at least one note.';
      this.cdr.markForCheck();
      return;
    }

    this.isSavingModalNote = true;
    this.modalNoteError = null;

    const createOps = validNotes.map(text => this.farmNoteService.createFarmNote(farmId, text));

    forkJoin(createOps).subscribe({
      next: () => {
        // Re-fetch fresh notes from FarmNotes collection via FarmNoteController
        this.farmNoteService.getFarmNotes(farmId).subscribe({
          next: (freshNotes) => {
            this.farmNotesMap.set(farmId, freshNotes || []);
            this.isSavingModalNote = false;
            this.showAddNoteModal = false;
            this.modalNotesList = [{ note: '' }];
            this.notesSavedSuccess = true;
            this.cdr.markForCheck();

            setTimeout(() => {
              this.notesSavedSuccess = false;
              this.cdr.markForCheck();
            }, 3500);
          },
          error: (err) => {
            console.warn('[HomeDashboard] Re-fetch fresh notes error:', err);
            this.isSavingModalNote = false;
            this.showAddNoteModal = false;
            this.modalNotesList = [{ note: '' }];
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('[HomeDashboard] createFarmNote error:', err);
        this.isSavingModalNote = false;
        this.modalNoteError = 'Failed to save note. Please check backend service and try again.';
        this.cdr.markForCheck();
      }
    });
  }

  toggleSelectNote(note: FarmNote): void {
    const isSame = this.selectedNote && (
      (this.selectedNote.noteId && this.selectedNote.noteId === note.noteId) ||
      (this.selectedNote.id && this.selectedNote.id === note.id)
    );
    this.selectedNote = isSame ? null : note;
    this.cdr.markForCheck();
  }

  openEditNoteModal(): void {
    if (!this.selectedNote) return;
    this.editNoteText = this.selectedNote.note;
    this.editNoteError = null;
    this.isSavingEditNote = false;
    this.showEditNoteModal = true;
    this.cdr.markForCheck();
  }

  closeEditNoteModal(): void {
    if (this.isSavingEditNote) return;
    this.showEditNoteModal = false;
    this.editNoteText = '';
    this.editNoteError = null;
    this.cdr.markForCheck();
  }

  saveEditNote(): void {
    if (!this.selectedNote) return;
    const farmId = this.selectedOverviewFarmId || (this.selectedOverviewFarm?.farmId ?? '');
    const noteId = this.selectedNote.noteId || this.selectedNote.id;
    if (!farmId || !noteId) {
      this.editNoteError = 'Missing farm or note identifier.';
      this.cdr.markForCheck();
      return;
    }

    const trimmed = this.editNoteText.trim();
    if (!trimmed) {
      this.editNoteError = 'Note content cannot be empty.';
      this.cdr.markForCheck();
      return;
    }

    this.isSavingEditNote = true;
    this.editNoteError = null;

    this.farmNoteService.updateFarmNote(noteId, farmId, trimmed).subscribe({
      next: () => {
        this.farmNoteService.getFarmNotes(farmId).subscribe({
          next: (freshNotes) => {
            this.farmNotesMap.set(farmId, freshNotes || []);
            this.isSavingEditNote = false;
            this.showEditNoteModal = false;
            this.selectedNote = null;
            this.notesSavedSuccess = true;
            this.cdr.markForCheck();

            setTimeout(() => {
              this.notesSavedSuccess = false;
              this.cdr.markForCheck();
            }, 3500);
          },
          error: (err) => {
            console.warn('[HomeDashboard] Re-fetch fresh notes error:', err);
            this.isSavingEditNote = false;
            this.showEditNoteModal = false;
            this.selectedNote = null;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('[HomeDashboard] updateFarmNote error:', err);
        this.isSavingEditNote = false;
        this.editNoteError = 'Failed to update note. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  openDeleteNoteModal(): void {
    if (!this.selectedNote) return;
    this.deleteNoteError = null;
    this.isDeletingNote = false;
    this.showDeleteNoteModal = true;
    this.cdr.markForCheck();
  }

  closeDeleteNoteModal(): void {
    if (this.isDeletingNote) return;
    this.showDeleteNoteModal = false;
    this.deleteNoteError = null;
    this.cdr.markForCheck();
  }

  confirmDeleteNote(): void {
    if (!this.selectedNote) return;
    const farmId = this.selectedOverviewFarmId || (this.selectedOverviewFarm?.farmId ?? '');
    const noteId = this.selectedNote.noteId || this.selectedNote.id;
    if (!farmId || !noteId) {
      this.deleteNoteError = 'Missing farm or note identifier.';
      this.cdr.markForCheck();
      return;
    }

    this.isDeletingNote = true;
    this.deleteNoteError = null;

    this.farmNoteService.deleteFarmNote(noteId).subscribe({
      next: () => {
        this.farmNoteService.getFarmNotes(farmId).subscribe({
          next: (freshNotes) => {
            this.farmNotesMap.set(farmId, freshNotes || []);
            this.isDeletingNote = false;
            this.showDeleteNoteModal = false;
            this.selectedNote = null;
            this.notesSavedSuccess = true;
            this.cdr.markForCheck();

            setTimeout(() => {
              this.notesSavedSuccess = false;
              this.cdr.markForCheck();
            }, 3500);
          },
          error: (err) => {
            console.warn('[HomeDashboard] Re-fetch fresh notes error:', err);
            this.isDeletingNote = false;
            this.showDeleteNoteModal = false;
            this.selectedNote = null;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('[HomeDashboard] deleteFarmNote error:', err);
        this.isDeletingNote = false;
        this.deleteNoteError = 'Failed to delete note. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.dashboardService.getAllFarmCrops().subscribe({
      next: (data: any[]) => {
        if (!Array.isArray(data)) {
          this.farms = [];
          this.isLoading = false;
          this.isRefreshing = false;
          return;
        }

        this.farms = data.map(farm => {
          const farmId = farm.farmId || farm.Id || '';
          const farmName = farm.farmName || farm.FarmName || 'Unnamed Farm';

          // Extract crops
          let cropsList: any[] = [];
          if (Array.isArray(farm.cropDetail) && farm.cropDetail.length > 0) {
            cropsList = farm.cropDetail;
          } else if (Array.isArray(farm.crops) && farm.crops.length > 0) {
            cropsList = farm.crops.map((c: any) =>
              typeof c === 'string' ? { cropId: c, cropName: `Crop ${c}` } : c
            );
          }

          const crops: CropDashboardItem[] = cropsList.map(c => {
            const cropId = c.cropId || c.Id || c;
            const cropName = c.cropName || c.CropName || 'Unnamed Crop';
            return {
              cropId,
              cropName,
              activities: [],
              observations: [],
              groupedActivities: [],
              groupedObservations: [],
              loadingActivities: true,
              loadingObservations: true,
              activeTab: 'activities'
            };
          });

          return {
            farmId,
            farmName,
            crops,
            expanded: false,
            selectedCropId: crops.length > 0 ? crops[0].cropId : 'ALL'
          };
        });

        // Initialize selected overview farm
        if (this.farms.length > 0) {
          const selectorFarmId = this.cropFarmSelector.selectedFarmId();
          const match = this.farms.find(f => f.farmId === selectorFarmId);
          this.selectedOverviewFarmId = match ? match.farmId : this.farms[0].farmId;
          this.loadOverviewFarmDetails(this.selectedOverviewFarmId);
        }

        this.isLoading = false;
        this.isRefreshing = false;

        // Fetch activities and observations for each crop
        this.fetchAllCropsData();
      },
      error: (err) => {
        console.error('Failed to fetch farms and crops for dashboard', err);
        this.farms = [];
        this.isLoading = false;
        this.isRefreshing = false;
      }
    });
  }

  refreshDashboard(): void {
    this.isRefreshing = true;
    this.loadDashboardData();
  }

  private fetchAllCropsData(): void {
    for (const farm of this.farms) {
      for (const crop of farm.crops) {
        if (!crop.cropId) {
          crop.loadingActivities = false;
          crop.loadingObservations = false;
          continue;
        }

        // Fetch activities
        this.activityService.getByCrop(crop.cropId).subscribe({
          next: (activities) => {
            crop.activities = Array.isArray(activities) ? activities : [];
            crop.groupedActivities = this.groupActivitiesByDate(crop.activities);
            crop.loadingActivities = false;
            setTimeout(() => this.updateActivitiesScrollState(), 150);
          },
          error: (err) => {
            console.error(`Failed to load activities for crop ${crop.cropId}`, err);
            crop.activities = [];
            crop.groupedActivities = [];
            crop.loadingActivities = false;
          }
        });

        // Fetch observations
        this.observationService.getByCrop(crop.cropId).subscribe({
          next: (observations) => {
            crop.observations = Array.isArray(observations) ? observations : [];
            crop.groupedObservations = this.groupObservationsByDate(crop.observations);
            crop.loadingObservations = false;
          },
          error: (err) => {
            console.error(`Failed to load observations for crop ${crop.cropId}`, err);
            crop.observations = [];
            crop.groupedObservations = [];
            crop.loadingObservations = false;
          }
        });
      }
    }
  }

  groupActivitiesByDate(activities: Activity[]): GroupedActivity[] {
    const sorted = [...activities].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const grouped: { [key: string]: Activity[] } = {};
    sorted.forEach(activity => {
      const date = new Date(activity.createdAt);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateKey = `${day}/${month}/${year}`;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });

    return Object.entries(grouped).map(([date, records]) => ({
      date,
      types: records.map(a => a.activityType).join(', '),
      uniqueTypes: Array.from(new Set(records.map(r => r.activityType).filter(Boolean))),
      messages: records.map(r => r.message).filter(Boolean).join(', '),
      originalRecords: records,
      isExpanded: false
    })).sort((a, b) =>
      new Date(b.originalRecords[0].createdAt).getTime() - new Date(a.originalRecords[0].createdAt).getTime()
    );
  }

  groupObservationsByDate(observations: Observation[]): GroupedObservation[] {
    const sorted = [...observations].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const grouped: { [key: string]: Observation[] } = {};
    sorted.forEach(obs => {
      const date = new Date(obs.createdAt);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateKey = `${day}/${month}/${year}`;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(obs);
    });

    return Object.entries(grouped).map(([date, records]) => ({
      date,
      types: records.map(o => o.observationType).join(', '),
      uniqueTypes: Array.from(new Set(records.map(r => r.observationType).filter(Boolean))),
      messages: records.map(o => o.message || '').filter(Boolean).join(', '),
      originalRecords: records,
      isExpanded: false
    })).sort((a, b) =>
      new Date(b.originalRecords[0].createdAt).getTime() - new Date(a.originalRecords[0].createdAt).getTime()
    );
  }

  toggleActivityGroup(group: GroupedActivity): void {
    if (group.originalRecords.length > 1) {
      group.isExpanded = !group.isExpanded;
    }
  }

  toggleObservationGroup(group: GroupedObservation): void {
    if (group.originalRecords.length > 1) {
      group.isExpanded = !group.isExpanded;
    }
  }

  toggleFarmExpand(farm: FarmDashboardItem): void {
    farm.expanded = !farm.expanded;
  }

  selectCrop(farm: FarmDashboardItem, cropId: string): void {
    farm.selectedCropId = cropId;
  }

  setCropTab(crop: CropDashboardItem, tab: 'activities' | 'observations'): void {
    crop.activeTab = tab;
  }

  getCropsForDisplay(farm: FarmDashboardItem): CropDashboardItem[] {
    if (farm.selectedCropId === 'ALL') {
      return farm.crops;
    }
    const selected = farm.crops.filter(c => c.cropId === farm.selectedCropId);
    return selected.length > 0 ? selected : farm.crops;
  }

  get filteredFarms(): FarmDashboardItem[] {
    let list = this.farms;

    if (this.selectedFarmFilter !== 'ALL') {
      list = list.filter(f => f.farmId === this.selectedFarmFilter);
    }

    if (!this.searchQuery.trim()) {
      return list;
    }

    const q = this.searchQuery.toLowerCase().trim();
    return list.filter(farm => {
      const farmMatches =
        (farm.farmName || '').toLowerCase().includes(q) ||
        (farm.farmId || '').toLowerCase().includes(q);

      const cropMatches = farm.crops.some(c =>
        (c.cropName || '').toLowerCase().includes(q) ||
        (c.cropId || '').toLowerCase().includes(q) ||
        c.activities.some(a =>
          (a.activityType || '').toLowerCase().includes(q) ||
          (a.message || '').toLowerCase().includes(q) ||
          (a.productName || '').toLowerCase().includes(q)
        ) ||
        c.observations.some(o =>
          (o.observationType || '').toLowerCase().includes(q) ||
          (o.message || '').toLowerCase().includes(q)
        )
      );

      return farmMatches || cropMatches;
    });
  }

  get totalFarmsCount(): number {
    return this.farms.length;
  }

  get totalCropsCount(): number {
    return this.farms.reduce((acc, f) => acc + f.crops.length, 0);
  }

  get totalActivitiesCount(): number {
    return this.farms.reduce(
      (farmAcc, f) => farmAcc + f.crops.reduce((cAcc, c) => cAcc + c.activities.length, 0),
      0
    );
  }

  get totalObservationsCount(): number {
    return this.farms.reduce(
      (farmAcc, f) => farmAcc + f.crops.reduce((cAcc, c) => cAcc + c.observations.length, 0),
      0
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  formatActivityMessage(activity: Activity): string {
    const details: string[] = [];
    if (activity.productName) {
      details.push(activity.productName);
    }
    if (activity.quantity != null) {
      details.push(`Qty: ${activity.quantity}`);
    }
    const prefix = details.length > 0 ? `[${details.join(', ')}] ` : '';
    return prefix + (activity.message || '');
  }

  getActivityGroupImageCount(group: GroupedActivity): number {
    return group.originalRecords.filter(r => this.hasImage(r.imageUrl)).length;
  }

  getObservationGroupImageCount(group: GroupedObservation): number {
    return group.originalRecords.filter(r => this.hasImage(r)).length;
  }

  getObservationGroupAudioCount(group: GroupedObservation): number {
    return group.originalRecords.filter(r => this.hasAudio(r)).length;
  }

  getDisplayMessage(messages: string, count: number): string {
    if (!messages) return '';
    if (count === 1) return messages;
    return messages.length > 60 ? messages.substring(0, 60) + '...' : messages;
  }

  // Visual helper styles for Activity Types
  getActivityBadgeClass(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('water')) return 'badge-sky';
    if (t.includes('spray')) return 'badge-purple';
    if (t.includes('fertiliz')) return 'badge-emerald';
    if (t.includes('weed')) return 'badge-amber';
    if (t.includes('seed')) return 'badge-green';
    if (t.includes('harvest')) return 'badge-orange';
    return 'badge-slate';
  }

  getActivityIcon(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('water')) return 'water_drop';
    if (t.includes('spray')) return 'sanitizer';
    if (t.includes('fertiliz')) return 'science';
    if (t.includes('weed')) return 'content_cut';
    if (t.includes('seed')) return 'grass';
    if (t.includes('harvest')) return 'agriculture';
    if (t.includes('photo')) return 'photo_camera';
    return 'task_alt';
  }

  // Visual helper styles for Observation Types
  getObservationBadgeClass(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('disease')) return 'badge-rose';
    if (t.includes('pest') || t.includes('insect')) return 'badge-red';
    if (t.includes('growth')) return 'badge-emerald';
    if (t.includes('water')) return 'badge-cyan';
    if (t.includes('nutri') || t.includes('deficien')) return 'badge-amber';
    if (t.includes('trap')) return 'badge-violet';
    return 'badge-slate';
  }

  getObservationIcon(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('disease')) return 'coronavirus';
    if (t.includes('pest') || t.includes('insect')) return 'pest_control';
    if (t.includes('growth')) return 'trending_up';
    if (t.includes('water')) return 'water';
    if (t.includes('nutri')) return 'biotech';
    return 'visibility';
  }

  // Image & Audio URL resolution
  resolveImageUrl(path: string | null | undefined): string | null {
    if (!path || !path.trim()) return null;
    const trimmed = path.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('assets/')) {
      return trimmed;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return this.fileServerService.getImageUrl(trimmed);
  }

  extractAudioFromRecord(record: any): string | null {
    if (!record) return null;
    if (typeof record === 'string') {
      const trimmed = record.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    const possibleProps = [
      'voiceNoteUrl', 'VoiceNoteUrl',
      'voiceNote', 'VoiceNote',
      'voiceNotePath', 'VoiceNotePath',
      'audioUrl', 'AudioUrl',
      'audio', 'Audio',
      'audioPath', 'AudioPath',
      'voiceUrl', 'VoiceUrl',
      'voice', 'Voice',
      'filePath', 'FilePath',
      'fileName', 'FileName',
      'attachment', 'Attachment',
      'fileUrl', 'FileUrl',
      'url', 'Url'
    ];

    for (const prop of possibleProps) {
      const val = record[prop];
      if (val && typeof val === 'string' && val.trim().length > 0) {
        const trimmed = val.trim();
        const lower = trimmed.toLowerCase();
        if (['filePath', 'FilePath', 'fileName', 'FileName', 'attachment', 'Attachment', 'fileUrl', 'FileUrl', 'url', 'Url'].includes(prop)) {
          if (lower.endsWith('.webm') || lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg') || lower.endsWith('.m4a') || lower.endsWith('.aac') || lower.includes('audio')) {
            return trimmed;
          }
        } else {
          return trimmed;
        }
      }
    }

    return null;
  }

  resolveAudioUrl(pathOrItem: any): string | null {
    if (!pathOrItem) return null;
    const path = typeof pathOrItem === 'string' ? pathOrItem : this.extractAudioFromRecord(pathOrItem);
    if (!path || !path.trim()) return null;
    const trimmed = path.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('assets/')) {
      return trimmed;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return this.fileServerService.getImageUrl(trimmed);
  }

  hasImage(item: any): boolean {
    return !!this.extractImageFromRecord(item);
  }

  getImagePath(item: any): string | null {
    return this.extractImageFromRecord(item);
  }

  hasAudio(item: any): boolean {
    return !!this.extractAudioFromRecord(item);
  }

  getAudioPath(item: any): string | null {
    return this.extractAudioFromRecord(item);
  }

  openImagePopup(imageUrl: string | null | undefined): void {
    if (!imageUrl || !imageUrl.trim()) return;
    const trimmed = imageUrl.trim();
    if (trimmed.startsWith('assets/') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      this.selectedImage = trimmed;
      this.showImagePopup = true;
      return;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      this.selectedImage = this.sanitizer.bypassSecurityTrustUrl(trimmed);
      this.showImagePopup = true;
      return;
    }
    const resolved = this.resolveImageUrl(trimmed);
    if (resolved) {
      this.selectedImage = this.sanitizer.bypassSecurityTrustUrl(resolved);
      this.showImagePopup = true;
    }
  }

  openAudioPopup(recordOrUrl: any): void {
    const resolved = this.resolveAudioUrl(recordOrUrl);
    if (resolved) {
      this.selectedAudioUrl = resolved;
      this.showAudioPopup = true;
    }
  }

  closeAudioPopup(): void {
    this.showAudioPopup = false;
    this.selectedAudioUrl = null;
  }

  onGalleryImageError(event: Event, index: number): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      const fallbacks = [
        'assets/images/gallery-rice-field.jpg',
        'assets/images/gallery-crop-rows.jpg',
        'assets/images/gallery-leafy-crops.jpg'
      ];
      const fallbackUrl = fallbacks[index % fallbacks.length];
      if (target.src !== fallbackUrl && !target.src.endsWith(fallbackUrl)) {
        target.src = fallbackUrl;
      }
    }
  }

  closeImagePopup(): void {
    this.showImagePopup = false;
    this.selectedImage = null;
  }
}
