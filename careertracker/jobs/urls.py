from django.urls import path
from . import views

urlpatterns = [
    path('', views.JobListView.as_view(), name='job_list'),
    path('<int:pk>/', views.JobUpdateView.as_view(), name='job_detail'),
    path('stats/', views.JobAnalyticsView.as_view(), name='job_analytics'),
]
