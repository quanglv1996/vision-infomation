"""Unit conversion helpers for Machine Vision calculations."""


class UnitConverter:
    """Convert between common Machine Vision units."""

    # ── Length (base: mm) ────────────────────────────────────────────────────
    @staticmethod
    def um_to_mm(v: float) -> float:
        return v / 1_000.0

    @staticmethod
    def mm_to_um(v: float) -> float:
        return v * 1_000.0

    @staticmethod
    def inch_to_mm(v: float) -> float:
        return v * 25.4

    @staticmethod
    def mm_to_inch(v: float) -> float:
        return v / 25.4

    @staticmethod
    def m_to_mm(v: float) -> float:
        return v * 1_000.0

    @staticmethod
    def mm_to_m(v: float) -> float:
        return v / 1_000.0

    # ── Speed ────────────────────────────────────────────────────────────────
    @staticmethod
    def ms_to_mms(v: float) -> float:
        """m/s → mm/s"""
        return v * 1_000.0

    @staticmethod
    def mms_to_ms(v: float) -> float:
        """mm/s → m/s"""
        return v / 1_000.0

    # ── Time ─────────────────────────────────────────────────────────────────
    @staticmethod
    def us_to_s(v: float) -> float:
        return v / 1_000_000.0

    @staticmethod
    def s_to_us(v: float) -> float:
        return v * 1_000_000.0

    @staticmethod
    def ms_to_s(v: float) -> float:
        return v / 1_000.0

    # ── Wavelength ───────────────────────────────────────────────────────────
    @staticmethod
    def nm_to_um(v: float) -> float:
        return v / 1_000.0

    @staticmethod
    def um_to_nm(v: float) -> float:
        return v * 1_000.0
