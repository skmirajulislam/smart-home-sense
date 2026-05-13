from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

DATA_PATH = Path(__file__).with_name("xiot_sensor_dataset_50000.csv")
MODEL_PATH = Path(__file__).with_name("smart_home_model.pkl")
REPORT_PATH = Path(__file__).with_name("smart_home_model_report.json")

FEATURES = ["temperature", "humidity", "motion", "gas", "aqi"]
TARGET = "risk"
LABEL_MAP = {"Normal": "Safe", "Warning": "Warning", "Danger": "Danger"}


def load_training_frame(path: Path) -> pd.DataFrame:
    raw = pd.read_csv(path)
    required = [*FEATURES, TARGET]
    missing = [column for column in required if column not in raw.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    frame = raw[required].copy()
    frame.loc[:, TARGET] = frame[TARGET].astype(str).str.strip().map(LABEL_MAP)
    for feature in FEATURES:
        frame.loc[:, feature] = pd.to_numeric(frame[feature], errors="coerce")
    frame.loc[:, "motion"] = frame["motion"].round()
    frame = frame.dropna(subset=required).copy()
    frame = frame[frame["motion"].isin([0.0, 1.0])].copy()
    frame.loc[:, "motion"] = frame["motion"].astype(int)
    return frame


def generate_synthetic_dangerous_samples(base_df: pd.DataFrame, n_samples: int = 500) -> pd.DataFrame:
    """
    Generate synthetic samples representing dangerous environmental conditions.
    These include extreme temperatures, high humidity, high AQI, and high gas levels.
    """
    np.random.seed(42)
    synthetic_data = []

    # Extreme high temperature scenarios (danger)
    for _ in range(n_samples // 5):
        synthetic_data.append({
            "temperature": np.random.uniform(45, 55),
            "humidity": np.random.uniform(30, 80),
            "motion": np.random.choice([0, 1]),
            "gas": np.random.uniform(300, 1000),
            "aqi": np.random.uniform(100, 250),
            "risk": "Danger",
        })

    # Extreme low temperature scenarios (danger)
    for _ in range(n_samples // 5):
        synthetic_data.append({
            "temperature": np.random.uniform(-40, 5),
            "humidity": np.random.uniform(20, 60),
            "motion": np.random.choice([0, 1]),
            "gas": np.random.uniform(100, 500),
            "aqi": np.random.uniform(50, 150),
            "risk": "Danger",
        })

    # Very high humidity + high AQI (danger)
    for _ in range(n_samples // 5):
        synthetic_data.append({
            "temperature": np.random.uniform(20, 30),
            "humidity": np.random.uniform(85, 100),
            "motion": np.random.choice([0, 1]),
            "gas": np.random.uniform(200, 800),
            "aqi": np.random.uniform(250, 400),
            "risk": "Danger",
        })

    # High AQI scenarios (warning to danger)
    for _ in range(n_samples // 5):
        synthetic_data.append({
            "temperature": np.random.uniform(18, 32),
            "humidity": np.random.uniform(40, 75),
            "motion": np.random.choice([0, 1]),
            "gas": np.random.uniform(400, 1500),
            "aqi": np.random.uniform(200, 350),
            "risk": "Danger" if np.random.random() > 0.4 else "Warning",
        })

    # High gas + moderate AQI (warning)
    for _ in range(n_samples // 5):
        synthetic_data.append({
            "temperature": np.random.uniform(20, 28),
            "humidity": np.random.uniform(50, 80),
            "motion": np.random.choice([0, 1]),
            "gas": np.random.uniform(800, 2000),
            "aqi": np.random.uniform(100, 200),
            "risk": "Warning",
        })

    synthetic_df = pd.DataFrame(synthetic_data)
    return pd.concat([base_df, synthetic_df], ignore_index=True)


def select_model(x_train: pd.DataFrame, y_train: pd.Series):
    candidates = {
        "random_forest": RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            min_samples_leaf=2,
            class_weight="balanced_subsample",
            random_state=42,
            n_jobs=1,
        ),
        "logistic_regression": Pipeline(
            [
                ("scale", StandardScaler()),
                ("clf", LogisticRegression(max_iter=5000, class_weight="balanced")),
            ]
        ),
    }

    splitter = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores: dict[str, float] = {}
    for name, candidate in candidates.items():
        score = cross_val_score(candidate, x_train, y_train,
                                cv=splitter, scoring="f1_weighted", n_jobs=1).mean()
        scores[name] = score
        print(f"CV weighted F1 ({name}): {score:.4f}")

    best_name = max(scores, key=lambda name: scores[name])
    print(f"Selected model: {best_name}")
    return candidates[best_name], best_name, scores


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

    model, selected_name, cv_scores = select_model(x_train, y_train)
    model.fit(x_train, y_train)

    train_pred = model.predict(x_train)
    test_pred = model.predict(x_test)

    train_accuracy = accuracy_score(y_train, train_pred)
    test_accuracy = accuracy_score(y_test, test_pred)
    test_weighted_f1 = f1_score(y_test, test_pred, average="weighted")
    report = classification_report(y_test, test_pred, output_dict=True)

    print(f"Train accuracy: {train_accuracy:.4f}")
    print(f"Test accuracy:  {test_accuracy:.4f}")
    print(f"Test weighted F1: {test_weighted_f1:.4f}")
    print("\nClassification report (test):")
    print(classification_report(y_test, test_pred))

    feature_importance = {}
    if hasattr(model, "feature_importances_"):
        values = getattr(model, "feature_importances_")
        feature_importance = {
            feature: round(float(score), 6)
            for feature, score in sorted(zip(FEATURES, values), key=lambda item: item[1], reverse=True)
        }

    iqr = (x.quantile(0.75) - x.quantile(0.25)).replace(0, 1.0)
    artifact = {
        "model": model,
        "feature_order": FEATURES,
        "classes": [str(label) for label in getattr(model, "classes_", sorted(training_df[TARGET].unique().tolist()))],
        "feature_median": {feature: float(x[feature].median()) for feature in FEATURES},
        "feature_iqr": {feature: float(iqr[feature]) for feature in FEATURES},
        "feature_importance": feature_importance,
        "dataset_rows": int(len(training_df)),
    }
    metrics = {
        "selected_model": selected_name,
        "cross_validation_weighted_f1": cv_scores,
        "train_accuracy": train_accuracy,
        "test_accuracy": test_accuracy,
        "test_weighted_f1": test_weighted_f1,
        "classification_report": report,
        "label_distribution": training_df[TARGET].value_counts().to_dict(),
        "feature_importance": feature_importance,
        "features": FEATURES,
        "dataset_rows": int(len(training_df)),
        "synthetic_samples_added": 2500,
    }
    return artifact, metrics


def main():
    frame = load_training_frame(DATA_PATH)
    print("Original class distribution:")
    print(frame[TARGET].value_counts().to_string())
    print(f"Original dataset size: {len(frame)}")

    # Augment with synthetic dangerous samples
    print("\nGenerating 2500 synthetic dangerous samples...")
    frame = generate_synthetic_dangerous_samples(frame, n_samples=2500)
    print(f"Augmented dataset size: {len(frame)}")
    print("\nAugmented class distribution:")
    print(frame[TARGET].value_counts().to_string())

    artifact, metrics = train_and_evaluate(frame)
    joblib.dump(artifact, MODEL_PATH, compress=3)
    REPORT_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"\nSaved trained model to: {MODEL_PATH}")
    print(f"Saved model report to: {REPORT_PATH}")


if __name__ == "__main__":
    main()
