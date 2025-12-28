import { HistoricalWeatherRange } from "../farm-weather/weather.service";
import { Coordinates } from "../location/geolocation.service";

export interface TimeRange {
    fromTime: string;
    toTime: string;
}

export interface GridPowerUnavailability {
    day: string;
    timeRanges: TimeRange[];
}

export interface FarmDto {
    farmName: string | null | undefined;
    surveyNumber: string | null | undefined;
    address: string | null | undefined;
    shadeNetArea: number;
    geoLocation: Coordinates | null | undefined;
    farmPondVolume: number | null | undefined;
    isSolarPowerAvailable: boolean | null | undefined;
    motorCapacity: string | null | undefined;
    additionalWaterSource: string | null | undefined;
    waterTestCertificateUrl: string | null | undefined;
    isSinglePhasePower: boolean | null | undefined;
    isThreePhasePower: boolean | null | undefined;
    //gridPowerUnAvailability?: GridPowerUnavailability[];
    automationRoomSize: number | null | undefined;
    //farmhouseNote?: string | null | undefined;
    storageAreaNote: string | null | undefined;
    historicalWeather: HistoricalWeatherRange | null;
}

export interface UpdateFarmDto extends FarmDto {
    Crops: string[];
}

export interface CreateFarmDto extends FarmDto {
    farmId: string;
}