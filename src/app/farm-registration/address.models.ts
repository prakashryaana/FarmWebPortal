export interface State {
    stateCode: number;
    stateName: string;
}

export interface District {
    districtCode: number;
    districtName: string;
}

export interface SubDistrict {
    subDistrictCode: number;
    subDistrictName: string;
}

export interface Taluka {
    talukaCode: number;
    talukaName: string;
}

export interface Hobli {
    hobliCode: number;
    hobliName: string;
}

export interface Village {
    villageCode: number;
    villageName: string;
}

export interface FarmAddress {
    addressLine: string | null | undefined;
    village: string | null | undefined;
    subDistrict: string | null | undefined;
    district: string | null | undefined;
    state: string | null | undefined;
    pincode: string | null | undefined;
    taluka?: string | null | undefined;
    hobli?: string | null | undefined;
    surveyNumber?: string | null | undefined;
    hissa?: string | null | undefined;
}