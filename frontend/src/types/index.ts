export interface UploadResponse {
  success: boolean;
  filename?: string;
  file_size?: number;
  message?: string;
}

export interface IngestionResponse {
  success: boolean;
  ingestion: {
    inserted: number;
    updated: number;
    duplicates: number;
    totalProcessed: number;
  };
  parserInfo: {
    sheetName: string;
    detectedReportColumns: number;
    parserVersion: string;
  };
  message?: string;
}

export interface VesselInfo {
  id: number;
  vesselName: string;
  technicalManager: string | null;
}

export interface ReportsSummary {
  totalVessels: number;
  totalReports: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

export interface VesselOverview {
  vesselName: string;
  totalReports: number;
  firstReportDate: string | null;
  latestReportDate: string | null;
  reportingCoverage: number;
}

export interface VoyagePerformance {
  totalDistanceSailed: number;
  averageSpeed: number | null;
  maximumSpeed: number | null;
  minimumSpeed: number | null;
  steamingDays: number;
  anchorageDays: number;
  ballastDays: number;
  loadedDays: number;
}

export interface FuelConsumptionBreakdown {
  lsfo: number;
  hsfo: number;
  mgo: number;
}

export interface FuelPerformance {
  totalLsfoConsumed: number;
  totalHsfoConsumed: number;
  totalMgoConsumed: number;
  averageDailyFuelConsumption: FuelConsumptionBreakdown;
  maximumDailyFuelConsumption: FuelConsumptionBreakdown;
  minimumDailyFuelConsumption: FuelConsumptionBreakdown;
}

export interface RobMetric {
  opening: number;
  closing: number;
  drawdown: number;
  avgDailyReduction: number;
}

export interface RobAnalytics {
  lsfo: RobMetric;
  hsfo: RobMetric;
  mgo: RobMetric;
  freshWater: RobMetric;
}

export interface WeatherAnalytics {
  averageBeaufort: number | null;
  maximumBeaufort: number | null;
  averageWindSpeed: number | null;
  severeWeatherDays: number;
}

export interface MachineryAnalytics {
  ae1TotalRunningHours: number;
  ae2TotalRunningHours: number;
  ae3TotalRunningHours: number;
  totalAuxiliaryEngineHours: number;
}

export interface OperationsAnalytics {
  daysAtAnchor: number;
  daysUnderway: number;
  daysInBallast: number;
  daysLoaded: number;
}

export interface DashboardPayload {
  vesselId: number;
  vesselName: string;
  overview: VesselOverview;
  voyage: VoyagePerformance;
  fuel: FuelPerformance;
  rob: RobAnalytics;
  weather: WeatherAnalytics;
  machinery: MachineryAnalytics;
  operations: OperationsAnalytics;
}

export interface FuelTrendPoint {
  date: string;
  lsfo: number;
  hsfo: number;
  mgo: number;
}

export interface SpeedTrendPoint {
  date: string;
  speed: number;
  rpm: number;
  slip: number;
  distance: number;
}

export interface WeatherTrendPoint {
  date: string;
  beaufort: number;
  windSpeed: number;
}

export interface TimelineEvent {
  date: string;
  vesselCondition: string | null;
  latitude: string | null;
  longitude: string | null;
  remarks: string | null;
}

export interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface OperationalInsight {
  category: "Voyage" | "Fuel" | "Weather" | "Operations" | "ROB" | "Machinery" | "General";
  source: string;
  type: "POSITIVE" | "WARNING" | "INFO";
  message: string;
  metadata?: Record<string, any>;
}

export interface RoutePosition {
  date: string;
  latitude: number;
  longitude: number;
  condition: string | null;
  remarks: string | null;
  latitudeRaw?: string | null;
  longitudeRaw?: string | null;
}

export interface RouteDataPayload {
  totalPoints: number;
  startDate: string | null;
  endDate: string | null;
  totalDistance: number;
  positions: RoutePosition[];
}

export interface PortInfo {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  code: string;
}

export interface PlannedRouteWaypoint {
  lat: number;
  lon: number;
}

export interface PlannedRouteScoreBreakdown {
  distance: number;
  weather: number;
  fuel: number;
  reliability: number;
}

export interface PlannedRouteInfo {
  id: number;
  routeName: string;
  distanceNm: number;
  routeType: string;
  isPrimary: boolean;
  dataSource: string | null;
  confidence: number | null;
  historicalSuccessRate: number | null;
  weatherRisk: string;
  fuelEstimateMt: number | null;
  waypoints: PlannedRouteWaypoint[] | null;
  score?: number;
  scoreBreakdown?: PlannedRouteScoreBreakdown;
}

export interface RoutePlanResult {
  origin: PortInfo;
  destination: PortInfo;
  recommendedRoute: PlannedRouteInfo | null;
  alternativeRoutes: PlannedRouteInfo[];
  recommendationReasons?: string[];
  generatedAt?: string;
  message?: string;
}


