from django.db.models import Q
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class BaseReportService:
    @staticmethod
    def apply_branch_scope(queryset, filters):
        """
        Enforce tenant & branch isolation using filters object.
        Applies `filters.branch_id` if present.
        """
        qs = queryset.filter(tenant=filters.user.tenant)
        if filters.branch_id:
            # Assumes the model has a branch_id or branch relation, OR the queryset has it joined
            qs = qs.filter(branch_id=filters.branch_id)
        return qs

    @staticmethod
    def apply_date_range(queryset, field, start_date, end_date):
        if start_date:
            queryset = queryset.filter(**{f"{field}__gte": start_date})
        if end_date:
            queryset = queryset.filter(**{f"{field}__lte": end_date})
        return queryset

    @staticmethod
    def apply_academic_year(queryset, ay_id, field="academic_year_id"):
        if ay_id:
            queryset = queryset.filter(**{field: ay_id})
        return queryset
