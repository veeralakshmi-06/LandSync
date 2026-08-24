import geopandas as gpd


def geometry_overlap_score(cadastral_geometry, survey_geometry):
    """
    Calculate polygon overlap percentage.

    Returns a score from 0 to 100.
    """

    if cadastral_geometry is None or survey_geometry is None:
        return 0.0

    if cadastral_geometry.is_empty or survey_geometry.is_empty:
        return 0.0

    try:
        # Convert both geometries to a metric CRS
        cadastral = gpd.GeoSeries(
            [cadastral_geometry],
            crs="EPSG:4326"
        ).to_crs("EPSG:32644").iloc[0]

        survey = gpd.GeoSeries(
            [survey_geometry],
            crs="EPSG:4326"
        ).to_crs("EPSG:32644").iloc[0]

        intersection_area = cadastral.intersection(survey).area
        survey_area = survey.area

        if survey_area == 0:
            return 0.0

        score = (intersection_area / survey_area) * 100

        return round(min(score, 100.0), 2)

    except Exception:
        return 0.0