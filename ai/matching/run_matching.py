import pandas as pd
import geopandas as gpd

from matcher import (
    survey_similarity,
    village_similarity,
    area_difference_percent,
    calculate_final_score
)


REVENUE_FILE = "data/dept_revenue.csv"
SURVEY_FILE = "data/dept_survey.geojson"

revenue = pd.read_csv(REVENUE_FILE)
survey = gpd.read_file(SURVEY_FILE)

results = []

for _, revenue_row in revenue.iterrows():

    best_match = None

    for _, survey_row in survey.iterrows():

        # Survey number similarity
        survey_score = survey_similarity(
            revenue_row["SurveyNo"],
            survey_row["s_no"]
        )

        # Village similarity
        village_score = village_similarity(
            revenue_row["Revenue_Village"],
            survey_row["village"]
        )

        # Area difference
        area_difference = area_difference_percent(
            revenue_row["Land_Area_Acres"],
            survey_row["extent_sqm"]
        )

        # Final confidence score
        final_score = calculate_final_score(
            survey_score,
            village_score,
            area_difference
        )

        # Store candidate match
        result = {
            "revenue_survey": revenue_row["SurveyNo"],
            "survey_s_no": survey_row["s_no"],
            "revenue_village": revenue_row["Revenue_Village"],
            "survey_village": survey_row["village"],
            "revenue_area_acres": revenue_row["Land_Area_Acres"],
            "survey_area_sqm": survey_row["extent_sqm"],
            "area_difference_percent": area_difference,
            "survey_score": survey_score,
            "village_score": village_score,
            "match_score": final_score
        }

        # Keep highest scoring match
        if (
            best_match is None
            or final_score > best_match["match_score"]
        ):
            best_match = result

    # Classify match
    if best_match:

        if best_match["match_score"] >= 90:
            best_match["status"] = "MATCH"

        elif best_match["match_score"] >= 70:
            best_match["status"] = "REVIEW"

        else:
            best_match["status"] = "UNMATCHED"
            best_match["survey_s_no"] = None

        results.append(best_match)


# Create result DataFrame
result_df = pd.DataFrame(results)


# Output file
output_file = "data/member1_matching_results.csv"

result_df.to_csv(
    output_file,
    index=False
)


# Display results
print("\n================================")
print(" WANDERWISE PARCEL MATCHING")
print("================================")

print(f"Revenue records : {len(revenue)}")
print(f"Survey records  : {len(survey)}")
print(f"Results created : {len(result_df)}")

print("\nResults:")
print(result_df.to_string(index=False))

print("\nOutput:")
print(output_file)