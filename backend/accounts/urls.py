from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, RefreshView, LogoutView, MeView, UserViewSet, ChangePasswordView
from . import parent_views

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/refresh/', RefreshView.as_view(), name='auth_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('auth/password/change/', ChangePasswordView.as_view(), name='auth_change_password'),
    # Parent Portal
    path('parent/children/', parent_views.parent_children, name='parent_children'),
    path('parent/children/<uuid:student_id>/profile/', parent_views.parent_child_profile, name='parent_child_profile'),
    path('parent/children/<uuid:student_id>/fees/invoices/', parent_views.parent_child_invoices, name='parent_child_invoices'),
    path('parent/children/<uuid:student_id>/attendance/', parent_views.parent_child_attendance, name='parent_child_attendance'),
    path('parent/children/<uuid:student_id>/homework/', parent_views.parent_child_homework, name='parent_child_homework'),
    path('parent/children/<uuid:student_id>/timetable/', parent_views.parent_child_timetable, name='parent_child_timetable'),
    path('parent/announcements/', parent_views.parent_announcements, name='parent_announcements'),
]
