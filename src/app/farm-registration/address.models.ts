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

export interface RestOfIndiaAddress {
    pincode: string;
    state: string;
    district: string;
    subDistrict: string;
    village: string;
    addressLine: string;
}

export interface KarnatakaAddress {
    pincode: string;
    state: string;
    district: string;
    taluka: string;
    hobli: string;
    village: string;
    surveyNumber: string;
    hissa: string;
}

export interface AggregateAddress {
    pincode: string;
    state: string;
    district: string;
    subDistrict: string;
    taluka: string;
    hobli: string;
    village: string;
    surveyNumber: string;
    hissa: string;
    addressLine: string;
}