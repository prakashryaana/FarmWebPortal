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
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { MagicCallbackComponent } from './magic-callback/magic-callback.component';
import { MagicRequestComponent } from './magic-request/magic-request.component';


export const routes: Routes = [
    // {
    //     path: '',
    //     component: HomeDashboardComponent,
    //     title: 'Dashboard'
    // },
    {
        path:'home',
        component: HomeComponent,
        title: 'Home'
    },
    {
        path: 'farm-registration',   // set this to blank to make it default route
        component: FarmRegistrationComponent,
        title: 'Farm Registration'
    },
    {
        path: 'farm-owner-registration',
        component: FarmOwnerRegistrationComponent,
        title: 'Farm Owner Registration'
    },
    {
        path: 'maintainer-registration/:farmId',
        component: MaintainerRegistrationComponent,
        title: 'Maintainer Registration'
    },
    {
        path: 'crop-registration',
        component: CropRegistrationComponent,
        title: 'Crop Registration'
    },
    {
        path: 'farm-lookup',
        component: FarmLookupComponent,
        title: 'Farm Lookup'
    },
    {
        path: 'location',
        component: LocationComponent,
        title: 'Geolocation'
    },
    {
        path: 'farm-weather',
        component: FarmWeatherComponent,
        title: 'Farm Weather'
    },
    {
        path: 'leaflet-map',
        component: LeafletMapComponent,
        title: 'Leaflet Map'
    },
    {
        path: 'add-activity',
        component: AddActivityComponent,
        title: 'Add Activity'
    },
    {
        path: 'list-activity',
        component: ListActivityComponent,
        title: 'List Activity'
    },
    {
        path: 'home-dashboard',
        component: HomeDashboardComponent,
        title: 'Dashboard'
    },
    { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'magic-request', component: MagicRequestComponent },
  { path: 'auth/magic/callback', component: MagicCallbackComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
