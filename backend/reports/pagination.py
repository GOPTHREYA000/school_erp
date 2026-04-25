from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class ReportPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 500

    def get_paginated_response(self, data):
        return Response({
            'success': True,
            'data': {
                'count': self.page.paginator.count,
                'total_pages': self.page.paginator.num_pages,
                'current_page': self.page.number,
                'page_size': self.get_page_size(self.request),
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'results': data
            }
        })

    @staticmethod
    def get_unpaginated_response(data):
        """For aggregate/summary endpoints where pagination isn't meaningful."""
        return Response({
            'success': True,
            'data': {
                'count': len(data),
                'total_pages': 1,
                'current_page': 1,
                'page_size': len(data),
                'next': None,
                'previous': None,
                'results': data
            }
        })
