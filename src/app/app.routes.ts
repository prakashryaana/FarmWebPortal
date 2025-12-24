import { Routes } from '@angular/router';
import { FarmOwnerRegistrationComponent } from './farm-owner-registration/farm-owner-registration.component';
import { FarmRegistrationComponent } from './farm-registration/farm-registration.component';
import { MaintainerRegistrationComponent } from './maintainer-registration/maintainer-registration.component';
import { HomeComponent } from './home/home.component';
import { CropRegistrationComponent } from './crop-registration/crop-registration.component';
import { FarmLookupComponent } from './farm-lookup/farm-lookup.component';
import { LocationComponent } from './location/location.component';
import { FarmWeatherComponent } from './farm-weather/farm-weather.component';
import { LeafletMapComponent } from './leaflet-map/leaflet-map.component';
//import { HierarchicalCropSelectorComponent } from './hierarchical-crop-selector/hierarchical-crop-selector.component';
import { AddActivityComponent } from './add-activity/add-activity.component';
import { ListActivityComponent } from './list-activity/list-activity.component';
import { HomeDashboardComponent } from './home-dashboard/home-dashboard.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { MagicCallbackComponent } from './auth/magic-callback/magic-callback.component';
import { MagicRequestComponent } from './auth/magic-request/magic-request.component';
import { authGuard } from './auth-guard';
import { UserManagementComponent } from './users/user-management/user-management.component';
import { ActionsComponent } from './actions/actions.component';


export const routes: Routes = [
    { path: 'farm-registration', component: FarmRegistrationComponent, canActivate: [authGuard] },
    { path: 'farm-owner-registration', component: FarmOwnerRegistrationComponent, canActivate: [authGuard] },
    { path: 'maintainer-registration/:farmId', component: MaintainerRegistrationComponent, canActivate: [authGuard] },
    { path: 'crop-registration', component: CropRegistrationComponent, canActivate: [authGuard] },
    { path: 'farm-lookup', component: FarmLookupComponent, canActivate: [authGuard] },
    { path: 'location', component: LocationComponent, canActivate: [authGuard] },
    { path: 'farm-weather', component: FarmWeatherComponent, canActivate: [authGuard] },
    { path: 'leaflet-map', component: LeafletMapComponent, canActivate: [authGuard] },
    { path: 'add-activity', component: AddActivityComponent, canActivate: [authGuard] },
    { path: 'list-activity', component: ListActivityComponent, canActivate: [authGuard] },
    { path: 'home-dashboard', component: HomeDashboardComponent, canActivate: [authGuard] },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    { path: 'magic-request', component: MagicRequestComponent, canActivate: [authGuard] },
    { path: 'auth/magic/callback', component: MagicCallbackComponent, canActivate: [authGuard] },
    // { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '', component: HomeDashboardComponent, canActivate: [authGuard] },
    { path: 'user-management', component: UserManagementComponent, canActivate: [authGuard] },
    { path: 'actions', component: ActionsComponent, canActivate: [authGuard] }
    // {
    // path: 'admin/users',
    // component: AdminUsersComponent,
    // canActivate: [authGuard, roleGuard],
    // data: { roles: ['Admin'] } //using role guard
    // }
];
