import { Routes } from '@angular/router';
import { FarmOwnerRegistrationComponent } from './farm-owner-registration/farm-owner-registration.component';
import { FarmRegistrationComponent } from './farm-registration/farm-registration.component';
import { MaintainerRegistrationComponent } from './maintainer-registration/maintainer-registration.component';

export const routes: Routes = [
    {
        path: '',
        component: FarmRegistrationComponent,
        title: 'Farm Registration'
    },
    {
        path: 'farm-owner-registration',
        component: FarmOwnerRegistrationComponent,
        title: 'Farm Owner Registration'
    },
    {
        path: 'maintainer-registration',
        component: MaintainerRegistrationComponent,
        title: 'Maintainer Registration'
    }
];
