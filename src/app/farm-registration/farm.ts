export interface FarmDto {
    farmName: string | null | undefined;
    surveyNumber: string | null | undefined;
    address: string | null | undefined;
    shadeNetArea: number;
    //geoTag: string | null | undefined;
    farmPondVolume: number | null | undefined;
    isSolarPowerAvailable: boolean | null | undefined;
    motorCapacity: string | null | undefined;
    additionalWaterSource: string | null | undefined;
    waterTestCertificateUrl: string | null | undefined;
    isSinglePhasePower: boolean | null | undefined;
    isThreePhasePower: boolean | null | undefined;
    //gridPowerUnAvailability: string | null | undefined;
    automationRoomSize: number | null | undefined;
    //farmhouseNote: string | null | undefined;
    storageAreaNote: string | null | undefined;
}

export interface UpdateFarmDto extends FarmDto {
    Crops: string[];
}

export interface CreateFarmDto extends FarmDto {
    farmId: string;
}