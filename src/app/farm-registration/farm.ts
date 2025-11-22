export interface Farm {
    farmId: string;
    farmName: string | null | undefined;
    surveyNumber: string | null | undefined;
    address: string | null | undefined;
    shadeNetArea: number;
    //geoTag: string | null | undefined;
    farmPondVolume: number | null | undefined;
    isSolarPowerAvailable: boolean | null | undefined;
    motorCapacity: number | null | undefined;
    additionalWaterSource: string | null | undefined;
    waterTestCertificateUrl: string | null | undefined;
    isSinglePhasePower: boolean | null | undefined;
    isThreePhasePower: boolean | null | undefined;
    //gridPowerUnAvailability: string | null | undefined;
    automationRoomSize: number | null | undefined;
    //farmhouseNote: string | null | undefined;
    storageAreaNote: string | null | undefined;
}