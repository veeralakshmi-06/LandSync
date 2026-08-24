import re


def normalize_survey_number(value):
    if value is None:
        return ""

    value = str(value).strip().upper()

    value = value.replace(" ", "")
    value = value.replace("-", "/")

    value = re.sub(r"/+", "/", value)

    return value