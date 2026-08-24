import sys
from unified_pipeline import run_full_harmonization
from data_quality_reporter import generate_quality_and_conflict_summary

def main():
    print("==========================================")
    print("LANDSYNC AI - DATA ENGINEERING PIPELINE")
    print("==========================================")
    
    # 1. Run Data Harmonization
    run_full_harmonization()
    
    # 2. Run Data Quality & Conflict Reporting
    generate_quality_and_conflict_summary()
    
    print("\n All Data Engineering Tasks Completed Successfully!")

if __name__ == "__main__":
    main()