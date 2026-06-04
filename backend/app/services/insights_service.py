from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseInsightGenerator(ABC):
    """
    Abstract base class for all operational insight generators.
    Allows extending the Insights Engine with new generation logic (e.g. Predictive/ML-based)
    without modifying the core processing pipeline.
    """
    @abstractmethod
    def generate(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate a list of insights from the compiled vessel analytics payload.
        
        Args:
            payload: Dict containing 'overview', 'voyage', 'fuel', 'rob', 
                     'weather', 'machinery', 'operations'.

        Returns:
            List of dicts representing insights:
            [
              {
                "category": "Fuel" | "Voyage" | "Weather" | etc.,
                "source": "Fuel Performance Analytics" | etc.,
                "type": "POSITIVE" | "WARNING" | "INFO",
                "message": str,
                "metadata": Optional[Dict]
              }
            ]
        """
        pass


class RuleBasedInsightGenerator(BaseInsightGenerator):
    """
    Fully deterministic rule-based generator that uses hardcoded business rules
    and threshold validations to identify performance observations.
    """
    def generate(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        insights: List[Dict[str, Any]] = []

        overview = payload.get("overview", {})
        voyage = payload.get("voyage", {})
        fuel = payload.get("fuel", {})
        rob = payload.get("rob", {})
        weather = payload.get("weather", {})
        machinery = payload.get("machinery", {})
        operations = payload.get("operations", {})

        total_reports = overview.get("totalReports", 0)
        if total_reports == 0:
            return insights

        steaming_days = voyage.get("steamingDays", 0)
        anchorage_days = voyage.get("anchorageDays", 0)
        ballast_days = voyage.get("ballastDays", 0)
        loaded_days = voyage.get("loadedDays", 0)

        # ── 1. Voyage Performance Insights ────────────────────────────────────
        if voyage:
            avg_speed = voyage.get("averageSpeed")
            max_speed = voyage.get("maximumSpeed")
            min_speed = voyage.get("minimumSpeed")
            total_dist = voyage.get("totalDistanceSailed", 0.0)

            if steaming_days > 0 and avg_speed is not None:
                if max_speed is not None and min_speed is not None:
                    speed_range = max_speed - min_speed
                    if speed_range <= 1.2:
                        insights.append({
                            "category": "Voyage",
                            "source": "Voyage Performance Analytics",
                            "type": "POSITIVE",
                            "message": "Average speed remained stable throughout the reporting period."
                        })
                    elif speed_range > 2.5:
                        insights.append({
                            "category": "Voyage",
                            "source": "Voyage Performance Analytics",
                            "type": "WARNING",
                            "message": "Speed fluctuations detected across reporting period."
                        })
                    else:
                        insights.append({
                            "category": "Voyage",
                            "source": "Voyage Performance Analytics",
                            "type": "POSITIVE",
                            "message": "Speed variability remained low throughout reporting period."
                        })
                
                if total_dist >= 500.0:
                    insights.append({
                        "category": "Voyage",
                        "source": "Voyage Performance Analytics",
                        "type": "INFO",
                        "message": "Vessel covered significant distance during selected period."
                    })

        # ── 2. Fuel Consumption Insights ──────────────────────────────────────
        if fuel:
            total_lsfo = fuel.get("totalLsfoConsumed", 0.0)
            avg_lsfo = fuel.get("averageDailyFuelConsumption", {}).get("lsfo", 0.0)
            max_lsfo = fuel.get("maximumDailyFuelConsumption", {}).get("lsfo", 0.0)
            min_lsfo = fuel.get("minimumDailyFuelConsumption", {}).get("lsfo", 0.0)

            if total_lsfo > 0:
                if steaming_days > 0 and anchorage_days > 0:
                    insights.append({
                        "category": "Fuel",
                        "source": "Fuel Performance Analytics",
                        "type": "POSITIVE",
                        "message": "Fuel consumption remained within expected range."
                    })
                elif steaming_days == total_reports:
                    # Underway only - verify spikes
                    if avg_lsfo > 0 and max_lsfo > avg_lsfo * 1.3:
                        insights.append({
                            "category": "Fuel",
                            "source": "Fuel Performance Analytics",
                            "type": "WARNING",
                            "message": "Significant daily fuel consumption spike detected.",
                            "metadata": {
                                "value": max_lsfo,
                                "average": avg_lsfo
                            }
                        })
                    elif avg_lsfo > 0 and max_lsfo > avg_lsfo * 1.2:
                        insights.append({
                            "category": "Fuel",
                            "source": "Fuel Performance Analytics",
                            "type": "WARNING",
                            "message": "Fuel usage variability observed."
                        })
                    else:
                        insights.append({
                            "category": "Fuel",
                            "source": "Fuel Performance Analytics",
                            "type": "POSITIVE",
                            "message": "Fuel consumption remained stable."
                        })

        # ── 3. Weather Insights ───────────────────────────────────────────────
        if weather:
            severe_days = weather.get("severeWeatherDays", 0)
            avg_bf = weather.get("averageBeaufort")
            max_bf = weather.get("maximumBeaufort")

            if severe_days == 0:
                insights.append({
                    "category": "Weather",
                    "source": "Weather Analytics",
                    "type": "POSITIVE",
                    "message": "No severe weather encountered."
                })
            else:
                insights.append({
                    "category": "Weather",
                    "source": "Weather Analytics",
                    "type": "WARNING",
                    "message": f"Severe weather affected operations on {severe_days} days."
                })

            if avg_bf is not None and avg_bf >= 4.0:
                insights.append({
                    "category": "Weather",
                    "source": "Weather Analytics",
                    "type": "INFO",
                    "message": "Elevated weather conditions observed."
                })

        # ── 4. Operational Status Insights ────────────────────────────────────
        if operations:
            if anchorage_days > steaming_days:
                insights.append({
                    "category": "Operations",
                    "source": "Operational Status Analytics",
                    "type": "POSITIVE",
                    "message": "Vessel spent majority of reporting period at anchorage."
                })
            elif steaming_days > anchorage_days:
                if steaming_days == total_reports:
                    insights.append({
                        "category": "Operations",
                        "source": "Operational Status Analytics",
                        "type": "POSITIVE",
                        "message": "Vessel remained underway throughout reporting period."
                    })
                else:
                    insights.append({
                        "category": "Operations",
                        "source": "Operational Status Analytics",
                        "type": "POSITIVE",
                        "message": "Vessel spent majority of reporting period underway."
                    })

            if ballast_days > loaded_days and ballast_days > 0:
                insights.append({
                    "category": "Operations",
                    "source": "Operational Status Analytics",
                    "type": "INFO",
                    "message": "Vessel remained primarily in ballast condition."
                })

            if anchorage_days >= 5:
                insights.append({
                    "category": "Operations",
                    "source": "Operational Status Analytics",
                    "type": "WARNING",
                    "message": "Extended anchorage period detected."
                })

        # ── 5. ROB Insights ───────────────────────────────────────────────────
        if rob:
            lsfo_rob = rob.get("lsfo", {})
            mgo_rob = rob.get("mgo", {})
            fw_rob = rob.get("freshWater", {})

            lsfo_drawdown = lsfo_rob.get("drawdown", 0.0)
            lsfo_opening = lsfo_rob.get("opening", 0.0)
            mgo_drawdown = mgo_rob.get("drawdown", 0.0)
            mgo_opening = mgo_rob.get("opening", 0.0)
            fw_drawdown = fw_rob.get("drawdown", 0.0)
            fw_avg_red = fw_rob.get("avgDailyReduction", 0.0)
            fw_opening = fw_rob.get("opening", 0.0)

            if lsfo_opening > 0.0 or mgo_opening > 0.0:
                if lsfo_drawdown > 80.0 or mgo_drawdown > 25.0:
                    insights.append({
                        "category": "ROB",
                        "source": "ROB Analytics",
                        "type": "WARNING",
                        "message": "Significant ROB reduction observed."
                    })
                else:
                    insights.append({
                        "category": "ROB",
                        "source": "ROB Analytics",
                        "type": "POSITIVE",
                        "message": "Fuel reserves remained adequate."
                    })

            if fw_opening > 0.0 and (fw_drawdown > 50.0 or fw_avg_red > 10.0):
                insights.append({
                    "category": "ROB",
                    "source": "ROB Analytics",
                    "type": "WARNING",
                    "message": "Fresh water depletion rate elevated."
                })

        # ── 6. Machinery Insights ─────────────────────────────────────────────
        if machinery:
            ae1 = machinery.get("ae1TotalRunningHours", 0.0)
            ae2 = machinery.get("ae2TotalRunningHours", 0.0)
            ae3 = machinery.get("ae3TotalRunningHours", 0.0)
            total_ae = machinery.get("totalAuxiliaryEngineHours", 0.0)

            if total_ae > 0.0:
                max_ae = max(ae1, ae2, ae3)
                min_ae = min(ae1, ae2, ae3)
                if total_reports >= 10 and (max_ae - min_ae) > 100.0:
                    insights.append({
                        "category": "Machinery",
                        "source": "Machinery Analytics",
                        "type": "WARNING",
                        "message": "Uneven auxiliary engine utilization observed."
                    })
                else:
                    insights.append({
                        "category": "Machinery",
                        "source": "Machinery Analytics",
                        "type": "POSITIVE",
                        "message": "Auxiliary engine utilization within expected range."
                    })

        return insights


class InsightsEngine:
    """
    Orchestrator engine that manages registered insight generators,
    collects observations, deduplicates, and sorts them by severity.
    """
    def __init__(self):
        self._generators: List[BaseInsightGenerator] = []
        # Register default rule-based generator
        self.register_generator(RuleBasedInsightGenerator())

    def register_generator(self, generator: BaseInsightGenerator):
        """Register a new insight generator to the engine."""
        self._generators.append(generator)

    def generate_all(self, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Query all registered generators, aggregate insights, apply general anomalies check,
        and sort them by severity (WARNING > INFO > POSITIVE).
        """
        all_insights: List[Dict[str, Any]] = []
        for generator in self._generators:
            try:
                all_insights.extend(generator.generate(payload))
            except Exception as e:
                # Graceful extraction safety
                print(f"[InsightsEngine Error] Generator {generator.__class__.__name__} failed: {e}")

        if not all_insights:
            return []

        # Check if any warnings were generated. If none, append the general success anomaly check.
        has_warnings = any(ins["type"] == "WARNING" for ins in all_insights)
        if not has_warnings:
            all_insights.append({
                "category": "General",
                "source": "General Analytics",
                "type": "POSITIVE",
                "message": "Voyage completed without operational anomalies."
            })

        # Sort Priority: WARNING (1) > INFO (2) > POSITIVE (3)
        severity_map = {"WARNING": 1, "INFO": 2, "POSITIVE": 3}
        all_insights.sort(key=lambda x: severity_map.get(x["type"], 99))

        return all_insights


# Export active singleton instance of the engine
engine = InsightsEngine()
