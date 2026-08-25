"""
LandSync GIS Engine - Main Processing Pipeline.
Orchestrates end-to-end processing across real geospatial datasets and satellite APIs:
REAL DATA -> CRS HARMONIZATION -> GEOMETRY VALIDATION -> AREA ANALYSIS -> SPATIAL MATCHING -> CONFLICT DETECTION -> SATELLITE CONTEXT -> UNIFIED GIS RESULT
"""

from typing import Dict, Any, Optional, Union
from pathlib import Path
import logging
import geopandas as gpd

from gis_engine.crs_harmonizer import CRSHarmonizer
from gis_engine.geometry_validator import GeometryValidator
from gis_engine.area_analyzer import AreaAnalyzer
from gis_engine.spatial_matcher import SpatialMatcher
from gis_engine.conflict_detector import ConflictDetector
from gis_engine.satellite.imagery_search import search_recent_imagery, select_best_scene
from utils.geometry_utils import load_geospatial_file

logger = logging.getLogger(__name__)

class GISPipeline:
    """
    Unified execution pipeline connecting vector processing modules with satellite metadata context.
    Designed to be invoked cleanly by downstream LandSync services or APIs.
    """

    def __init__(
        self,
        crs_harmonizer: Optional[CRSHarmonizer] = None,
        validator: Optional[GeometryValidator] = None,
        area_analyzer: Optional[AreaAnalyzer] = None,
        matcher: Optional[SpatialMatcher] = None,
        conflict_detector: Optional[ConflictDetector] = None
    ):
        self.harmonizer = crs_harmonizer or CRSHarmonizer()
        self.validator = validator or GeometryValidator()
        self.area_analyzer = area_analyzer or AreaAnalyzer()
        self.matcher = matcher or SpatialMatcher()
        self.conflict_detector = conflict_detector or ConflictDetector(
            validator=self.validator,
            area_analyzer=self.area_analyzer,
            matcher=self.matcher
        )

    def run_pipeline(
        self,
        cadastral_source: Union[str, Path, gpd.GeoDataFrame],
        survey_source: Union[str, Path, gpd.GeoDataFrame],
        parcel_id_col: str = "parcel_id",
        area_claim_col: Optional[str] = None,
        fetch_satellite_context: bool = False,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute full end-to-end GIS pipeline.

        Returns:
            Unified result dictionary containing:
            - crs_info
            - cadastral_summary
            - survey_summary
            - conflicts
            - satellite_context
        """
        logger.info("Initializing LandSync GIS Harmonization Pipeline...")

        # 1. Real Data Ingestion
        cadastral_gdf = load_geospatial_file(cadastral_source) if isinstance(cadastral_source, (str, Path)) else cadastral_source
        survey_gdf = load_geospatial_file(survey_source) if isinstance(survey_source, (str, Path)) else survey_source

        # 2. CRS Harmonization
        cad_h, sur_h, harmonization_meta = self.harmonizer.harmonize_pair(cadastral_gdf, survey_gdf)
        common_crs = harmonization_meta["target_crs"] if isinstance(harmonization_meta, dict) else harmonization_meta

        # 3. Geometry Validation
        cad_val = self.validator.validate_geodataframe(cad_h)
        sur_val = self.validator.validate_geodataframe(sur_h)

        # 4. Area Analysis
        cad_area = self.area_analyzer.calculate_projected_area(cad_h)
        sur_area = self.area_analyzer.calculate_projected_area(sur_h)

        # 5 & 6. Spatial Matching & Conflict Detection
        conflicts = self.conflict_detector.detect_conflicts(
            cadastral_gdf=cad_area,
            survey_gdf=sur_area,
            id_col=parcel_id_col,
            area_claim_col=area_claim_col
        )

        # 7. Satellite Context (Optional)
        satellite_context = None
        if fetch_satellite_context and start_date and end_date and not cad_h.empty:
            try:
                results = search_recent_imagery(cad_h, start_date=start_date, end_date=end_date)
                best_scene = select_best_scene(results)
                satellite_context = {
                    "total_scenes_found": len(results),
                    "best_scene": best_scene
                }
            except Exception as e:
                logger.warning(f"Failed to retrieve satellite context: {str(e)}")
                satellite_context = {"error": str(e)}

        # 8. Unified Result Compilation
        unified_result = {
            "status": "SUCCESS",
            "common_crs": common_crs,
            "cadastral_validation": cad_val,
            "survey_validation": sur_val,
            "total_conflicts": len(conflicts),
            "conflicts": conflicts,
            "satellite_context": satellite_context
        }

        logger.info(f"LandSync GIS Pipeline completed successfully. Found {len(conflicts)} conflict records.")
        return unified_result
