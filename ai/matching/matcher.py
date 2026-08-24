from difflib import SequenceMatcher

from normalizer import normalize_survey_number


def survey_similarity(revenue_survey, survey_survey):
    revenue_survey = normalize_survey_number(revenue_survey)
    survey_survey = normalize_survey_number(survey_survey)

    if not revenue_survey or not survey_survey:
        return 0.0

    if revenue_survey == survey_survey:
        return 100.0

    score = SequenceMatcher(
        None,
        revenue_survey,
        survey_survey
    ).ratio()

    return round(score * 100, 2)


def village_similarity(revenue_village, survey_village):
    if not revenue_village or not survey_village:
        return 0.0

    revenue_village = str(revenue_village).strip().upper()
    survey_village = str(survey_village).strip().upper()

    if revenue_village == survey_village:
        return 100.0

    return 0.0


def area_difference_percent(revenue_acres, survey_sqm):
    if revenue_acres is None or survey_sqm is None:
        return None

    try:
        revenue_acres = float(revenue_acres)
        survey_sqm = float(survey_sqm)
    except (ValueError, TypeError):
        return None

    # 1 acre = 4046.8564224 square metres
    survey_acres = survey_sqm / 4046.8564224

    if revenue_acres == 0:
        return None

    difference = abs(revenue_acres - survey_acres)

    percentage = (
        difference / revenue_acres
    ) * 100

    return round(percentage, 2)


def calculate_final_score(
    survey_score,
    village_score,
    area_difference,
    geometry_score=None
):
    # --------------------------------
    # Calculate area score
    # --------------------------------

    if area_difference is None:
        area_score = 0.0

    elif area_difference <= 5:
        area_score = 100.0

    elif area_difference <= 10:
        area_score = 80.0

    elif area_difference <= 20:
        area_score = 60.0

    elif area_difference <= 30:
        area_score = 40.0

    else:
        area_score = 0.0


    # --------------------------------
    # Calculate final score
    # --------------------------------

    # If geometry is available:
    #
    # Survey number = 40%
    # Village       = 20%
    # Area          = 20%
    # Geometry      = 20%

    if geometry_score is not None:

        final_score = (
            survey_score * 0.40
            + village_score * 0.20
            + area_score * 0.20
            + geometry_score * 0.20
        )

    # If geometry is not available:
    #
    # Survey number = 50%
    # Village       = 20%
    # Area          = 30%

    else:

        final_score = (
            survey_score * 0.50
            + village_score * 0.20
            + area_score * 0.30
        )


    return round(final_score, 2)