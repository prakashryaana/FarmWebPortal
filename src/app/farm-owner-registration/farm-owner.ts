import { HealthCheck } from "../maintainer-registration/maintainer";

export interface FarmOwner {
    ownerId: string;
    ownerName: string | null | undefined;
    //farmName: string;
    // farmsOwned: string[];
    // maintainers: string[];
    contactNumber: string | null | undefined;
    alternateContactNumber: string | null | undefined;
    emailId: string | null | undefined;
    address: string | null | undefined;
    identityProofDocument: string | null | undefined;
    identityProofNumber: string | null | undefined;
    healthChecks: HealthCheck[];
}