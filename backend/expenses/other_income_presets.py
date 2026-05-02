"""
Preset category labels for manual (non-fee) other income on the cashbook.

These are suggestions for consistent reporting; callers may still use a custom label
when choosing "Other", except reserved fee-module names.
"""

# Shown in UI and validated server-side as allowed presets (custom text also allowed).
MANUAL_OTHER_INCOME_CATEGORY_PRESETS = (
    'Uniforms',
    'Trips & excursions',
    'Events & fests',
    'Books & stationery',
    'Sports & equipment',
    'Lab & materials',
    'Transport (non-fee)',
    'Donations',
    'Hall & facility rent',
    'ID cards & certificates',
    'Miscellaneous',
)

# Must not be used for manual other income (fee ledger / module).
RESERVED_MANUAL_OTHER_INCOME_CATEGORIES = frozenset(
    {
        'Fee Payment',
        'Fee Reversal',
    }
)
