from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.JobListView.as_view(), name='job_list'),
    path('<int:pk>/', views.JobDetailView.as_view(), name='job_detail'),
    path('stats/', views.JobAnalyticsView.as_view(), name='job_analytics'),
    path('interviews/', views.InterviewListView.as_view(), name='interviews_list'),
    path('interviews/<int:pk>/', views.InterviewDetailView.as_view(), name='interview_detail'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
