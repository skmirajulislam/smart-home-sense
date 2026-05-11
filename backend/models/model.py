from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
import random

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import RobustScaler

RAW_DATA_PATH = Path(__file__).with_name("xiot_sensor_dataset.csv")
CLEAN_DATA_PATH = Path(__file__).with_name("xiot_sensor_dataset_clean.csv")
TRAINING_DATA_PATH = Path(__file__).with_name("xiot_sensor_training_dataset.csv")
MODEL_PATH = Path(__file__).with_name("smart_home_model.pkl")

FEATURES = ["temperature", "humidity", "motion", "gas", "aqi"]
TARGET = "risk"
ORIGINAL_TARGET = "risk_original"
LABEL_MAP = {"Normal": "Safe", "Warning": "Warning", "Danger": "Danger"}
FRONTEND_BOUNDS = {
    "temperature": (10.0, 45.0),
    "humidity": (0.0, 100.0),
    "motion": (0.0, 1.0),
    "gas": (0.0, 1000.0),
    "aqi": (0.0, 500.0),
}


def classify_risk(temperature: float, humidity: float, aqi: float, gas: float, motion: int) -> str:
    score = 0

    if temperature >= 35:
        score += 2
    elif temperature >= 30:
        score += 1

    if humidity >= 80:
        score += 2
    elif humidity >= 65:
        score += 1

    if aqi >= 150:
        score += 2
    elif aqi >= 100:
        score += 1

    if gas >= 220:
        score += 2
    elif gas >= 140:
        score += 1

    if motion == 0 and (temperature >= 30 or aqi >= 100 or gas >= 140):
        score += 1

    if score >= 6:
        return "Danger"
    if score >= 3:
        return "Warning"
    return "Safe"


def load_and_clean_original_csv(path: Path) -> pd.DataFrame:
    raw = pd.read_csv(path)
    missing_columns = [column for column in [*FEATURES, TARGET] if column not in raw.columns]
    if missing_columns:
        raise ValueError(f"Dataset missing required columns: {missing_columns}")

    cleaned = raw[[*FEATURES, TARGET]].copy()
    cleaned.loc[:, TARGET] = cleaned[TARGET].astype(str).str.strip().map(LABEL_MAP)
    cleaned = cleaned.rename(columns={TARGET: ORIGINAL_TARGET})

    for column in FEATURES:
        cleaned.loc[:, column] = pd.to_numeric(cleaned[column], errors="coerce")

    cleaned.loc[:, "motion"] = cleaned["motion"].round()
    before_rows = len(cleaned)
    cleaned = cleaned.dropna(subset=[*FEATURES, ORIGINAL_TARGET]).drop_duplicates().copy()
    cleaned = cleaned[cleaned["motion"].isin([0.0, 1.0])].copy()
    cleaned.loc[:, "motion"] = cleaned["motion"].astype(int)
    after_rows = len(cleaned)

    print(f"Rows before cleaning: {before_rows}")
    print(f"Rows after cleaning:  {after_rows}")
    print(f"Rows dropped:         {before_rows - after_rows}")

    for feature, (low, high) in FRONTEND_BOUNDS.items():
        outlier_count = int(((cleaned[feature] < low) | (cleaned[feature] > high)).sum())
        print(f"Out-of-bound values ({feature}): {outlier_count}")

    # Keep a bounded copy for audit/readability.
    bounded = cleaned.copy()
    for feature, (low, high) in FRONTEND_BOUNDS.items():
        bounded.loc[:, feature] = bounded[feature].clip(lower=low, upper=high)

    bounded.loc[:, TARGET] = bounded.apply(
        lambda row: classify_risk(
            temperature=row["temperature"],
            humidity=row["humidity"],
            aqi=row["aqi"],
            gas=row["gas"],
            motion=int(row["motion"]),
        ),
        axis=1,
    )
    return bounded


def build_frontend_like_synthetic_dataset(target_per_class: int = 2000, seed: int = 42) -> pd.DataFrame:
    rng = random.Random(seed)
    collected: dict[str, list[dict[str, float | int | str]]] = defaultdict(list)
    max_iterations = 5_000_000
    for _ in range(max_iterations):
        if min((len(collected["Safe"]), len(collected["Warning"]), len(collected["Danger"]))) >= target_per_class:
            break

        temperature = rng.uniform(10.0, 45.0)
        humidity = rng.uniform(0.0, 100.0)
        aqi = rng.uniform(0.0, 500.0)
        motion = 1 if rng.random() > 0.7 else 0
        door = 0 if rng.random() > 0.1 else 1
        gas = max(0.0, min(1000.0, aqi * 1.2 + (25.0 if door == 0 else -10.0) + rng.uniform(-40.0, 40.0)))

        label = classify_risk(temperature=temperature, humidity=humidity, aqi=aqi, gas=gas, motion=motion)
        if len(collected[label]) >= target_per_class:
            continue

        collected[label].append(
            {
                "temperature": round(temperature, 2),
                "humidity": round(humidity, 2),
                "motion": motion,
                "gas": round(gas, 2),
                "aqi": round(aqi, 2),
                TARGET: label,
            }
        )

    if min((len(collected["Safe"]), len(collected["Warning"]), len(collected["Danger"]))) < target_per_class:
        raise RuntimeError("Could not generate enough synthetic samples for all classes.")

    rows = [*collected["Safe"], *collected["Warning"], *collected["Danger"]]
    dataset = pd.DataFrame(rows)
    return dataset.sample(frac=1.0, random_state=seed).reset_index(drop=True)


def select_model(x_train: pd.DataFrame, y_train: pd.Series):
    candidates = {
        "random_forest": RandomForestClassifier(
            n_estimators=500,
            min_samples_leaf=2,
            class_weight="balanced_subsample",
            random_state=42,
            n_jobs=1,
        ),
        "logistic_regression": Pipeline(
            [
                ("scale", RobustScaler()),
                ("clf", LogisticRegression(max_iter=4000, class_weight="balanced")),
            ]
        ),
    }

    splitter = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = {}
    for name, candidate in candidates.items():
        score = cross_val_score(candidate, x_train, y_train, cv=splitter, scoring="f1_weighted", n_jobs=1).mean()
        scores[name] = score
        print(f"CV weighted F1 ({name}): {score:.4f}")

    best_name = max(scores, key=scores.get)
    print(f"Selected model: {best_name}")
    return candidates[best_name]


def train_and_evaluate(training_df: pd.DataFrame):
    x = training_df[FEATURES]
    y = training_df[TARGET]
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = select_model(x_train, y_train)
    model.fit(x_train, y_train)

    train_pred = model.predict(x_train)
    test_pred = model.predict(x_test)

    print(f"Train accuracy: {accuracy_score(y_train, train_pred):.4f}")
    print(f"Test accuracy:  {accuracy_score(y_test, test_pred):.4f}")
    print(f"Test weighted F1: {f1_score(y_test, test_pred, average='weighted'):.4f}")
    print("\nClassification report (test):")
    print(classification_report(y_test, test_pred))

    return model


def main():
    cleaned_original = load_and_clean_original_csv(RAW_DATA_PATH)
    print("\nOriginal (mapped) class distribution after cleaning:")
    print(cleaned_original[ORIGINAL_TARGET].value_counts().to_string())
    print("\nFrontend-rule class distribution from bounded original data:")
    print(cleaned_original[TARGET].value_counts().to_string())
    agreement = (cleaned_original[TARGET] == cleaned_original[ORIGINAL_TARGET]).mean()
    print(f"\nLabel agreement (original vs frontend rule): {agreement:.4f}")

    cleaned_original.to_csv(CLEAN_DATA_PATH, index=False)
    print(f"Saved cleaned CSV to: {CLEAN_DATA_PATH}")

    synthetic = build_frontend_like_synthetic_dataset(target_per_class=2000, seed=42)
    print("\nSynthetic frontend-like class distribution:")
    print(pd.Series(Counter(synthetic[TARGET])).to_string())

    training_df = synthetic.sample(frac=1.0, random_state=42).reset_index(drop=True)
    training_df.to_csv(TRAINING_DATA_PATH, index=False)
    print(f"Saved training CSV to: {TRAINING_DATA_PATH}")

    model = train_and_evaluate(training_df)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved trained model to: {MODEL_PATH}")


if __name__ == "__main__":
    main()
